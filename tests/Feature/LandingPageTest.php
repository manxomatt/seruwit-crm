<?php

namespace Tests\Feature;

use App\Models\Setting;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LandingPageTest extends TestCase
{
    use RefreshDatabase;

    public function test_stock_landing_page_is_rendered_with_auth_flags_and_public_settings(): void
    {
        Setting::factory()->create([
            'key' => 'general.site_name',
            'value' => 'Seruwit Biz Demo',
            'is_public' => true,
        ]);
        Setting::factory()->create([
            'key' => 'general.site_tagline',
            'value' => 'Operasi bisnis dalam satu workspace',
            'is_public' => true,
        ]);

        $response = $this->get(route('home'));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('Welcome')
            ->where('canLogin', true)
            ->where('canRegister', true)
            ->has('availableLocales')
            ->has('locale')
            ->has('settings', fn ($settings) => $settings
                ->where('general.site_name', 'Seruwit Biz Demo')
                ->where('general.site_tagline', 'Operasi bisnis dalam satu workspace')
                ->etc()
            )
            ->has('translations.landing.hero.title_highlight')
            ->has('translations.landing.nav.language')
            ->has('translations.landing.modules.items.inventory.title')
            ->has('translations.landing.how.steps.register.title')
            ->has('translations.landing.cta.primary')
        );
    }

    public function test_guest_can_switch_landing_locale_between_english_and_indonesian(): void
    {
        $this->get(route('home'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Welcome')
                ->where('translations.landing.hero.cta_primary', 'Start Free')
                ->where('translations.landing.hero.cta_secondary', 'Log In')
                ->where('translations.landing.nav.cta', 'Start Free')
                ->where('translations.landing.nav.language', 'Language')
                ->where('translations.landing.modules.groups.supply.label', 'Supply & Warehouse')
                ->where('translations.landing.how.steps.register.title', 'Register your company')
                ->where('translations.landing.footer.description_fallback', 'A modular operations platform for distribution, logistics, rental, and field sales.')
            );

        $this->from(route('home'))
            ->patch(route('locale.update'), ['locale' => 'id'])
            ->assertRedirect(route('home'));

        $this->get(route('home'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Welcome')
                ->where('locale', 'id')
                ->where('translations.landing.hero.cta_primary', 'Daftar Gratis')
                ->where('translations.landing.hero.cta_secondary', 'Masuk')
                ->where('translations.landing.nav.cta', 'Daftar Gratis')
                ->where('translations.landing.nav.language', 'Bahasa')
                ->where('translations.landing.modules.groups.supply.label', 'Supply & Gudang')
                ->where('translations.landing.how.steps.register.title', 'Daftarkan perusahaan')
                ->where('translations.landing.footer.description_fallback', 'Platform operasi modular untuk distribusi, logistik, rental, dan penjualan lapangan.')
            );

        $this->from(route('home'))
            ->patch(route('locale.update'), ['locale' => 'en'])
            ->assertRedirect(route('home'));

        $this->get(route('home'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Welcome')
                ->where('locale', 'en')
                ->where('translations.landing.hero.cta_primary', 'Start Free')
                ->where('translations.landing.nav.language', 'Language')
            );
    }
}
