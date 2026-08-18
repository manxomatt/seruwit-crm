<?php

namespace Tests\Feature\Reseller;

use App\Models\ResellerProfile;
use App\Support\Reseller\ResellerAttribution;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Tests\TestCase;
use Tests\Traits\WithResellerCommissions;

/**
 * Crediting a self-serve signup to the reseller whose link brought it in.
 */
class ReferralAttributionTest extends TestCase
{
    use RefreshDatabase, WithResellerCommissions;

    public function test_a_ref_query_parameter_is_remembered_in_a_cookie(): void
    {
        $reseller = $this->makeReseller();
        $profile = $this->makeProfile($reseller);

        $this->get('/?ref='.$profile->referral_code)
            ->assertCookie(ResellerAttribution::COOKIE, $profile->referral_code);
    }

    public function test_a_code_resolves_to_its_reseller(): void
    {
        $reseller = $this->makeReseller();
        $profile = $this->makeProfile($reseller);

        $this->assertSame($reseller->global_id, ResellerAttribution::resolve($profile->referral_code));
        $this->assertSame($reseller->global_id, ResellerAttribution::resolve(strtolower($profile->referral_code)));
    }

    public function test_an_unknown_code_is_ignored(): void
    {
        $this->assertNull(ResellerAttribution::resolve('SRW-NOPE99'));
        $this->assertNull(ResellerAttribution::resolve(null));
        $this->assertNull(ResellerAttribution::resolve('   '));
    }

    public function test_a_terminated_partners_code_stops_working(): void
    {
        $reseller = $this->makeReseller();
        $profile = $this->makeProfile($reseller, ['status' => ResellerProfile::STATUS_TERMINATED]);

        $this->assertNull(ResellerAttribution::resolve($profile->referral_code));
    }

    public function test_a_fresh_link_beats_a_stale_cookie(): void
    {
        $request = Request::create('/?ref=SRW-FRESH1');
        $request->cookies->set(ResellerAttribution::COOKIE, 'SRW-STALE1');

        $this->assertSame('SRW-FRESH1', ResellerAttribution::codeFromRequest($request));
    }

    public function test_applying_attribution_stamps_the_earning_window(): void
    {
        config()->set('reseller.attribution_months', 24);

        $reseller = $this->makeReseller();
        $tenant = $this->makeTenant();

        $this->assertTrue(ResellerAttribution::apply($tenant, $reseller->global_id));

        $tenant->refresh();

        $this->assertSame($reseller->global_id, $tenant->reseller_global_id);
        $this->assertNotNull($tenant->reseller_attributed_at);
        $this->assertEqualsWithDelta(
            now()->addMonths(24)->timestamp,
            $tenant->reseller_attribution_ends_at->timestamp,
            120,
        );
        $this->assertTrue($tenant->hasActiveResellerAttribution());
    }

    public function test_a_lifetime_attribution_has_no_end_date(): void
    {
        config()->set('reseller.attribution_months', null);

        $reseller = $this->makeReseller();
        $tenant = $this->makeTenant();

        ResellerAttribution::apply($tenant, $reseller->global_id);

        $this->assertNull($tenant->refresh()->reseller_attribution_ends_at);
    }

    /**
     * Otherwise the last person to send a link takes credit for someone else's
     * customer.
     */
    public function test_first_touch_wins_and_is_never_overwritten(): void
    {
        $first = $this->makeReseller();
        $second = $this->makeReseller();
        $tenant = $this->makeTenant($first->global_id);

        $this->assertFalse(ResellerAttribution::apply($tenant, $second->global_id));
        $this->assertSame($first->global_id, $tenant->refresh()->reseller_global_id);
    }
}
