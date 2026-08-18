<?php

namespace Tests\Feature\Reseller;

use App\Models\Plan;
use App\Models\ResellerCommissionRule;
use App\Models\ResellerProfile;
use App\Models\Tenant;
use App\Models\User;
use App\Services\ResellerCommissionResolver;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Tests\Traits\WithResellerCommissions;

/**
 * Volume tiers: the first-payment rate climbs with how many paying tenants a
 * reseller has already converted. See config/reseller.php for the precedence
 * this sits at (last resort before the flat config default) and why it never
 * applies to renewals.
 */
class CommissionVolumeTierTest extends TestCase
{
    use RefreshDatabase, WithResellerCommissions;

    private User $reseller;

    private Plan $plan;

    protected function setUp(): void
    {
        parent::setUp();

        config()->set('reseller.default_rate', ['type' => 'percent', 'value' => 10]);
        config()->set('reseller.renewal_rate', ['type' => 'percent', 'value' => 5]);
        config()->set('reseller.tiers', [
            'enabled' => true,
            'levels' => [
                ['min_tenants' => 0, 'rate' => 10],
                ['min_tenants' => 2, 'rate' => 20],
            ],
        ]);

        $this->reseller = $this->makeReseller();
        $this->plan = $this->makePlan(1_000_000);
    }

    private function resolver(): ResellerCommissionResolver
    {
        return app(ResellerCommissionResolver::class);
    }

    private function quoteFor(Tenant $tenant): ?\App\Support\Reseller\CommissionQuote
    {
        return $this->resolver()->resolve($this->makeOrder($tenant, $this->plan), $tenant);
    }

    public function test_tiers_disabled_falls_back_to_the_flat_default(): void
    {
        config()->set('reseller.tiers.enabled', false);

        $tenant = $this->makeTenant($this->reseller->global_id);

        $this->assertEqualsWithDelta(10.0, $this->quoteFor($tenant)->rateValue, 0.01);
    }

    public function test_first_paying_tenant_gets_the_base_tier(): void
    {
        $tenant = $this->makeTenant($this->reseller->global_id);

        $this->assertEqualsWithDelta(10.0, $this->quoteFor($tenant)->rateValue, 0.01);
    }

    /**
     * With levels at 0 and 2, the third distinct paying tenant is the one that
     * benefits — by then two tenants already exist as live commissions.
     */
    public function test_the_tenant_that_crosses_the_threshold_earns_the_higher_tier(): void
    {
        $this->confirmOrder($this->makeOrder($this->makeTenant($this->reseller->global_id), $this->plan));
        $this->confirmOrder($this->makeOrder($this->makeTenant($this->reseller->global_id), $this->plan));

        $third = $this->makeTenant($this->reseller->global_id);

        $this->assertEqualsWithDelta(20.0, $this->quoteFor($third)->rateValue, 0.01);
    }

    /**
     * The second tenant is the one that brings the running total up to the
     * threshold — it must not benefit from a level it is still establishing.
     */
    public function test_the_tenant_that_establishes_the_threshold_does_not_benefit_from_it(): void
    {
        $this->confirmOrder($this->makeOrder($this->makeTenant($this->reseller->global_id), $this->plan));

        $second = $this->makeTenant($this->reseller->global_id);

        $this->assertEqualsWithDelta(10.0, $this->quoteFor($second)->rateValue, 0.01);
    }

    public function test_voided_commissions_do_not_count_toward_volume(): void
    {
        $first = $this->confirmOrder($this->makeOrder($this->makeTenant($this->reseller->global_id), $this->plan));
        $second = $this->confirmOrder($this->makeOrder($this->makeTenant($this->reseller->global_id), $this->plan));

        app(\App\Services\ResellerCommissionService::class)->voidForOrder($first, 'Refund');

        // Only one live paying tenant remains — still below the threshold of 2.
        $third = $this->makeTenant($this->reseller->global_id);
        $this->assertEqualsWithDelta(10.0, $this->quoteFor($third)->rateValue, 0.01);
        $this->assertNotNull($second);
    }

    /**
     * Renewals are a distinct, intentional exception: the tier only rewards
     * bringing in new paying customers, not the size of the book.
     */
    public function test_renewal_commissions_are_never_tiered(): void
    {
        config()->set('reseller.tiers.levels', [
            ['min_tenants' => 0, 'rate' => 10],
            ['min_tenants' => 1, 'rate' => 90],
        ]);

        $tenant = $this->makeTenant($this->reseller->global_id);
        $this->confirmOrder($this->makeOrder($tenant, $this->plan));

        $renewalOrder = $this->makeOrder($tenant->fresh(), $this->plan, 'renew');
        $quote = $this->resolver()->resolve($renewalOrder, $tenant->fresh());

        $this->assertEqualsWithDelta(5.0, $quote->rateValue, 0.01);
    }

    public function test_a_platform_wide_rule_still_beats_the_tier(): void
    {
        ResellerCommissionRule::query()->create([
            'reseller_global_id' => null,
            'applies_to' => ResellerCommissionRule::APPLIES_ALL,
            'type' => ResellerCommissionRule::TYPE_PERCENT,
            'value' => 33,
            'is_active' => true,
        ]);

        $tenant = $this->makeTenant($this->reseller->global_id);

        $this->assertEqualsWithDelta(33.0, $this->quoteFor($tenant)->rateValue, 0.01);
    }

    public function test_a_profile_default_still_beats_the_tier(): void
    {
        $this->makeProfile($this->reseller, [
            'default_commission_type' => 'percent',
            'default_commission_value' => 44,
        ]);

        $tenant = $this->makeTenant($this->reseller->global_id);

        $this->assertEqualsWithDelta(44.0, $this->quoteFor($tenant)->rateValue, 0.01);
    }

    public function test_a_reseller_specific_rule_still_beats_the_tier(): void
    {
        ResellerCommissionRule::query()->create([
            'reseller_global_id' => $this->reseller->global_id,
            'applies_to' => ResellerCommissionRule::APPLIES_ALL,
            'type' => ResellerCommissionRule::TYPE_PERCENT,
            'value' => 55,
            'is_active' => true,
        ]);

        $tenant = $this->makeTenant($this->reseller->global_id);

        $this->assertEqualsWithDelta(55.0, $this->quoteFor($tenant)->rateValue, 0.01);
    }

    public function test_volume_is_scoped_to_this_reseller_only(): void
    {
        $other = $this->makeReseller();
        $this->confirmOrder($this->makeOrder($this->makeTenant($other->global_id), $this->plan));
        $this->confirmOrder($this->makeOrder($this->makeTenant($other->global_id), $this->plan));

        // The reseller under test still has zero paying tenants of their own.
        $tenant = $this->makeTenant($this->reseller->global_id);
        $this->assertEqualsWithDelta(10.0, $this->quoteFor($tenant)->rateValue, 0.01);
    }

    public function test_levels_out_of_order_in_config_still_resolve_correctly(): void
    {
        config()->set('reseller.tiers.levels', [
            ['min_tenants' => 2, 'rate' => 20],
            ['min_tenants' => 0, 'rate' => 10],
        ]);

        $this->confirmOrder($this->makeOrder($this->makeTenant($this->reseller->global_id), $this->plan));
        $this->confirmOrder($this->makeOrder($this->makeTenant($this->reseller->global_id), $this->plan));

        $third = $this->makeTenant($this->reseller->global_id);

        $this->assertEqualsWithDelta(20.0, $this->quoteFor($third)->rateValue, 0.01);
    }

    public function test_a_suspended_profile_still_earns_a_tiered_rate(): void
    {
        $this->makeProfile($this->reseller, ['status' => ResellerProfile::STATUS_SUSPENDED]);

        $tenant = $this->makeTenant($this->reseller->global_id);

        $this->assertEqualsWithDelta(10.0, $this->quoteFor($tenant)->rateValue, 0.01);
    }
}
