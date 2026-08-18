<?php

namespace Tests\Feature\Reseller;

use App\Models\Role;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Tests\Traits\WithResellerCommissions;

/**
 * A reseller's public pitch page and its self-serve editor.
 */
class ResellerLandingPageTest extends TestCase
{
    use RefreshDatabase, WithResellerCommissions;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RoleSeeder::class);
    }

    private function resellerWithRole(): User
    {
        $user = User::factory()->create();
        $user->assignRole(Role::query()->where('slug', 'reseller')->firstOrFail());

        return $user;
    }

    // -----------------------------------------------------------------------
    // Public page
    // -----------------------------------------------------------------------

    public function test_an_unknown_referral_code_404s(): void
    {
        $this->get('/r/SRW-NOPE99')->assertNotFound();
    }

    public function test_a_disabled_page_404s_even_with_content_filled_in(): void
    {
        $reseller = $this->makeReseller();
        $profile = $this->makeProfile($reseller, [
            'landing_is_enabled' => false,
            'landing_headline' => 'Kelola bisnis lebih mudah',
        ]);

        $this->get('/r/'.$profile->referral_code)->assertNotFound();
    }

    public function test_an_enabled_page_with_no_headline_404s(): void
    {
        $reseller = $this->makeReseller();
        $profile = $this->makeProfile($reseller, ['landing_is_enabled' => true]);

        $this->get('/r/'.$profile->referral_code)->assertNotFound();
    }

    public function test_a_live_page_renders_without_authentication(): void
    {
        $reseller = $this->makeReseller();
        $profile = $this->makeProfile($reseller, [
            'landing_is_enabled' => true,
            'landing_headline' => 'Kelola bisnis lebih mudah',
            'landing_subheadline' => 'Semua dalam satu platform',
            'landing_cta_text' => 'Mulai Sekarang',
            'landing_highlights' => ['Setup 5 menit', 'Dukungan 24/7'],
        ]);

        $response = $this->get('/r/'.$profile->referral_code);

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('Reseller/LandingPage')
            ->where('referralCode', $profile->referral_code)
            ->where('headline', 'Kelola bisnis lebih mudah')
            ->where('ctaText', 'Mulai Sekarang')
            ->where('highlights', ['Setup 5 menit', 'Dukungan 24/7']));
    }

    public function test_a_missing_cta_text_falls_back_to_the_default(): void
    {
        $reseller = $this->makeReseller();
        $profile = $this->makeProfile($reseller, [
            'landing_is_enabled' => true,
            'landing_headline' => 'Judul',
        ]);

        $this->get('/r/'.$profile->referral_code)
            ->assertInertia(fn ($page) => $page->where('ctaText', __('reseller.landing.default_cta')));
    }

    public function test_the_referral_code_lookup_is_case_insensitive(): void
    {
        $reseller = $this->makeReseller();
        $profile = $this->makeProfile($reseller, [
            'landing_is_enabled' => true,
            'landing_headline' => 'Judul',
        ]);

        $this->get('/r/'.strtolower($profile->referral_code))->assertOk();
    }

    // -----------------------------------------------------------------------
    // Self-serve editor
    // -----------------------------------------------------------------------

    public function test_guests_cannot_edit_the_landing_page(): void
    {
        $this->patch(route('module.reseller.landing-page.update'), [])
            ->assertRedirect(route('login'));
    }

    public function test_a_plain_user_cannot_edit_a_landing_page(): void
    {
        $user = User::factory()->create();
        $user->assignRole(Role::query()->where('slug', 'user')->firstOrFail());

        $this->actingAs($user)
            ->patch(route('module.reseller.landing-page.update'), ['landing_is_enabled' => true])
            ->assertForbidden();
    }

    public function test_a_reseller_can_publish_their_own_page(): void
    {
        $reseller = $this->resellerWithRole();

        $this->actingAs($reseller)
            ->patch(route('module.reseller.landing-page.update'), [
                'landing_is_enabled' => true,
                'landing_headline' => 'Judul Baru',
                'landing_subheadline' => 'Sub judul',
                'landing_cta_text' => 'Daftar',
                'landing_highlights' => ['Poin 1', 'Poin 2'],
            ])
            ->assertRedirect();

        $profile = \App\Models\ResellerProfile::query()->where('reseller_global_id', $reseller->global_id)->firstOrFail();

        $this->assertTrue($profile->landing_is_enabled);
        $this->assertSame('Judul Baru', $profile->landing_headline);
        $this->assertSame(['Poin 1', 'Poin 2'], $profile->landing_highlights);
        $this->assertTrue($profile->hasLandingPage());

        $this->get('/r/'.$profile->referral_code)->assertOk();
    }

    public function test_editing_creates_the_profile_on_first_use(): void
    {
        $reseller = $this->resellerWithRole();

        $this->assertNull(\App\Models\ResellerProfile::query()->where('reseller_global_id', $reseller->global_id)->first());

        $this->actingAs($reseller)
            ->patch(route('module.reseller.landing-page.update'), ['landing_headline' => 'Judul'])
            ->assertRedirect();

        $this->assertNotNull(\App\Models\ResellerProfile::query()->where('reseller_global_id', $reseller->global_id)->first());
    }

    public function test_a_reseller_cannot_publish_someone_elses_page(): void
    {
        $reseller = $this->resellerWithRole();
        $other = $this->makeReseller();
        $otherProfile = $this->makeProfile($other, ['landing_headline' => 'Original']);

        $this->actingAs($reseller)
            ->patch(route('module.reseller.landing-page.update'), ['landing_headline' => 'Hijacked'])
            ->assertRedirect();

        $this->assertSame('Original', $otherProfile->fresh()->landing_headline);
    }

    public function test_at_most_four_highlights_are_accepted(): void
    {
        $reseller = $this->resellerWithRole();

        $this->actingAs($reseller)
            ->patch(route('module.reseller.landing-page.update'), [
                'landing_highlights' => ['A', 'B', 'C', 'D', 'E'],
            ])
            ->assertSessionHasErrors('landing_highlights');
    }

    public function test_a_headline_over_the_length_limit_is_rejected(): void
    {
        $reseller = $this->resellerWithRole();

        $this->actingAs($reseller)
            ->patch(route('module.reseller.landing-page.update'), [
                'landing_headline' => str_repeat('a', 130),
            ])
            ->assertSessionHasErrors('landing_headline');
    }

    public function test_dashboard_reports_whether_the_page_is_actually_live(): void
    {
        $reseller = $this->resellerWithRole();
        $this->makeProfile($reseller, ['landing_is_enabled' => true]);

        $this->actingAs($reseller)
            ->get(route('module.reseller.dashboard'))
            ->assertInertia(fn ($page) => $page->where('landing.is_live', false));

        \App\Models\ResellerProfile::query()
            ->where('reseller_global_id', $reseller->global_id)
            ->update(['landing_headline' => 'Judul']);

        $this->actingAs($reseller)
            ->get(route('module.reseller.dashboard'))
            ->assertInertia(fn ($page) => $page->where('landing.is_live', true));
    }
}
