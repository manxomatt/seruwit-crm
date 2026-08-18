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
 * The rate resolution chain, tier by tier:
 * reseller rules → profile defaults → platform rules → config.
 */
class CommissionRuleResolutionTest extends TestCase
{
    use RefreshDatabase, WithResellerCommissions;

    private User $reseller;

    private Tenant $tenant;

    private Plan $plan;

    protected function setUp(): void
    {
        parent::setUp();

        config()->set('reseller.default_rate', ['type' => 'percent', 'value' => 10]);
        config()->set('reseller.renewal_rate', ['type' => 'percent', 'value' => 5]);

        $this->reseller = $this->makeReseller();
        $this->tenant = $this->makeTenant($this->reseller->global_id);
        $this->plan = $this->makePlan(1_000_000);
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    private function rule(array $attributes): ResellerCommissionRule
    {
        return ResellerCommissionRule::query()->create(array_merge([
            'reseller_global_id' => $this->reseller->global_id,
            'plan_id' => null,
            'applies_to' => ResellerCommissionRule::APPLIES_ALL,
            'type' => ResellerCommissionRule::TYPE_PERCENT,
            'value' => 10,
            'is_active' => true,
        ], $attributes));
    }

    private function quote(string $type = 'activate', string $interval = 'month'): ?\App\Support\Reseller\CommissionQuote
    {
        $order = $this->makeOrder($this->tenant, $this->plan, $type, $interval);

        return app(ResellerCommissionResolver::class)->resolve($order, $this->tenant);
    }

    public function test_falls_back_to_config_when_nothing_is_configured(): void
    {
        $quote = $this->quote();

        $this->assertNotNull($quote);
        $this->assertNull($quote->rule);
        $this->assertEqualsWithDelta(10.0, $quote->rateValue, 0.01);
        $this->assertEqualsWithDelta(100_000, $quote->commissionAmount, 0.01);
    }

    public function test_platform_rule_beats_config(): void
    {
        $this->rule(['reseller_global_id' => null, 'value' => 20]);

        $quote = $this->quote();

        $this->assertEqualsWithDelta(20.0, $quote->rateValue, 0.01);
        $this->assertEqualsWithDelta(200_000, $quote->commissionAmount, 0.01);
    }

    public function test_profile_default_beats_platform_rule(): void
    {
        $this->rule(['reseller_global_id' => null, 'value' => 20]);
        $this->makeProfile($this->reseller, [
            'default_commission_type' => 'percent',
            'default_commission_value' => 25,
        ]);

        $this->assertEqualsWithDelta(25.0, $this->quote()->rateValue, 0.01);
    }

    public function test_reseller_rule_beats_profile_default(): void
    {
        $this->makeProfile($this->reseller, [
            'default_commission_type' => 'percent',
            'default_commission_value' => 25,
        ]);
        $this->rule(['value' => 30]);

        $this->assertEqualsWithDelta(30.0, $this->quote()->rateValue, 0.01);
    }

    public function test_plan_scoped_rule_beats_all_plan_rule(): void
    {
        $this->rule(['value' => 10]);
        $this->rule(['plan_id' => $this->plan->id, 'value' => 15]);

        $this->assertEqualsWithDelta(15.0, $this->quote()->rateValue, 0.01);
    }

    public function test_event_scoped_rule_beats_catch_all(): void
    {
        $this->rule(['value' => 10]);
        $this->rule(['applies_to' => ResellerCommissionRule::APPLIES_FIRST, 'value' => 18]);

        $this->assertEqualsWithDelta(18.0, $this->quote()->rateValue, 0.01);
        $this->assertEqualsWithDelta(10.0, $this->quote('renew')->rateValue, 0.01);
    }

    public function test_interval_scoped_rule_beats_any_interval_rule(): void
    {
        $this->rule(['value' => 10]);
        $this->rule(['billing_interval' => 'annual', 'value' => 12]);

        $this->assertEqualsWithDelta(10.0, $this->quote('activate', 'month')->rateValue, 0.01);
        $this->assertEqualsWithDelta(12.0, $this->quote('activate', 'annual')->rateValue, 0.01);
    }

    public function test_priority_breaks_ties_between_equally_specific_rules(): void
    {
        $this->rule(['value' => 10, 'priority' => 0]);
        $this->rule(['value' => 40, 'priority' => 5]);

        $this->assertEqualsWithDelta(40.0, $this->quote()->rateValue, 0.01);
    }

    public function test_rules_outside_their_validity_window_are_ignored(): void
    {
        $this->rule(['value' => 50, 'ends_at' => now()->subDay()]);
        $this->rule(['value' => 60, 'starts_at' => now()->addDay()]);

        $this->assertEqualsWithDelta(10.0, $this->quote()->rateValue, 0.01);
    }

    public function test_inactive_rules_are_ignored(): void
    {
        $this->rule(['value' => 50, 'is_active' => false]);

        $this->assertEqualsWithDelta(10.0, $this->quote()->rateValue, 0.01);
    }

    public function test_flat_rate_is_capped_at_the_payment(): void
    {
        $this->rule(['type' => ResellerCommissionRule::TYPE_FLAT, 'value' => 5_000_000]);

        $this->assertEqualsWithDelta(1_000_000, $this->quote()->commissionAmount, 0.01);
    }

    public function test_flat_rate_below_the_payment_is_paid_in_full(): void
    {
        $this->rule(['type' => ResellerCommissionRule::TYPE_FLAT, 'value' => 75_000]);

        $this->assertEqualsWithDelta(75_000, $this->quote()->commissionAmount, 0.01);
    }

    public function test_occurrence_cap_stops_further_commissions(): void
    {
        $this->rule(['value' => 10, 'max_occurrences' => 1]);

        $this->confirmOrder($this->makeOrder($this->tenant, $this->plan));

        // Second cycle is past the cap: the rule matches but yields nothing.
        $this->assertNull($this->quote('renew'));
    }

    public function test_zero_renewal_rate_makes_commissions_first_payment_only(): void
    {
        config()->set('reseller.renewal_rate', ['type' => 'percent', 'value' => 0]);

        $this->assertNotNull($this->quote());
        $this->assertNull($this->quote('renew'));
    }

    public function test_profile_renewal_value_overrides_its_default(): void
    {
        $this->makeProfile($this->reseller, [
            'default_commission_type' => 'percent',
            'default_commission_value' => 20,
            'renewal_commission_value' => 3,
        ]);

        $this->assertEqualsWithDelta(20.0, $this->quote()->rateValue, 0.01);
        $this->assertEqualsWithDelta(3.0, $this->quote('renew')->rateValue, 0.01);
    }

    public function test_another_resellers_rule_never_applies(): void
    {
        $other = $this->makeReseller();
        $this->rule(['reseller_global_id' => $other->global_id, 'value' => 90]);

        $this->assertEqualsWithDelta(10.0, $this->quote()->rateValue, 0.01);
    }

    public function test_rule_for_another_plan_never_applies(): void
    {
        $otherPlan = $this->makePlan(500_000, 'commission-other');
        $this->rule(['plan_id' => $otherPlan->id, 'value' => 90]);

        $this->assertEqualsWithDelta(10.0, $this->quote()->rateValue, 0.01);
    }

    public function test_suspended_profile_still_resolves_a_rate(): void
    {
        $this->makeProfile($this->reseller, ['status' => ResellerProfile::STATUS_SUSPENDED]);

        $this->assertNotNull($this->quote());
    }
}
