<?php

namespace Tests\Feature\Modules\Rental;

use App\Models\Setting;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Rental\Support\RentalStorefrontSettings;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class RentalStorefrontSettingsTest extends TestCase
{
    use RefreshDatabase;
    use WithRoles;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
        $this->setUpRoles();

        Setting::query()->updateOrCreate(
            ['key' => 'rental.passenger_booking_enabled'],
            [
                'group' => 'rental',
                'value' => '1',
                'type' => 'boolean',
                'label' => 'Passenger rental',
                'is_public' => false,
                'sort_order' => 2,
            ],
        );
    }

    public function test_storefront_tab_renders_with_defaults(): void
    {
        $this->actingAs($this->createUserWithRole())
            ->get(route('module.rental.settings.index', ['tab' => 'storefront']))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/Rental/Settings/Index')
                ->where('tab', 'storefront')
                ->where('storefront.primary_color', RentalStorefrontSettings::DEFAULT_PRIMARY_COLOR)
                ->where('storefront.secondary_color', RentalStorefrontSettings::DEFAULT_SECONDARY_COLOR)
            );
    }

    public function test_storefront_settings_can_be_updated(): void
    {
        $user = $this->createAdminUser();

        $this->actingAs($user)
            ->patch(route('module.rental.settings.storefront.update'), [
                'brand_name' => 'Seruwit Rental',
                'primary_color' => '#1d4ed8',
                'secondary_color' => '#0b1220',
                'support_phone' => '+62 812 0000 1111',
                'logo_url' => 'https://cdn.example.com/logo.png',
                'hero_title' => 'Sewa Mobil Terpercaya',
                'hero_subtitle' => 'Armada terawat, harga transparan.',
                'hero_image_url' => 'https://cdn.example.com/hero.jpg',
                'social_instagram' => 'https://instagram.com/seruwit',
                'business_hours' => 'Senin–Sabtu 08.00–20.00',
            ])
            ->assertRedirect();

        $stored = RentalStorefrontSettings::all();

        $this->assertSame('Seruwit Rental', $stored['brand_name']);
        $this->assertSame('#1d4ed8', $stored['primary_color']);
        $this->assertSame('#0b1220', $stored['secondary_color']);
        $this->assertSame('+62 812 0000 1111', $stored['support_phone']);
        $this->assertSame('https://cdn.example.com/logo.png', $stored['logo_url']);
        $this->assertSame('Sewa Mobil Terpercaya', $stored['hero_title']);
        $this->assertSame('https://instagram.com/seruwit', $stored['social_instagram']);
        $this->assertSame('Senin–Sabtu 08.00–20.00', $stored['business_hours']);
    }

    public function test_storefront_rejects_invalid_color(): void
    {
        $this->actingAs($this->createAdminUser())
            ->patch(route('module.rental.settings.storefront.update'), [
                'primary_color' => 'teal',
                'secondary_color' => '#0b1220',
            ])
            ->assertSessionHasErrors('primary_color');
    }

    public function test_storefront_rejects_non_url_logo(): void
    {
        $this->actingAs($this->createAdminUser())
            ->patch(route('module.rental.settings.storefront.update'), [
                'primary_color' => '#1d4ed8',
                'secondary_color' => '#0b1220',
                'logo_url' => 'not-a-url',
            ])
            ->assertSessionHasErrors('logo_url');
    }

    public function test_public_search_brand_reflects_storefront_settings(): void
    {
        RentalStorefrontSettings::update([
            'brand_name' => 'Seruwit Rental',
            'primary_color' => '#1d4ed8',
            'secondary_color' => '#0b1220',
            'support_phone' => '+62 812 0000 1111',
            'logo_url' => 'https://cdn.example.com/logo.png',
            'hero_title' => 'Sewa Mobil Terpercaya',
            'hero_subtitle' => 'Armada terawat, harga transparan.',
        ]);

        $this->get(route('book.rental.search'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/Rental/Public/Search')
                ->where('brand.name', 'Seruwit Rental')
                ->where('brand.color', '#1d4ed8')
                ->where('brand.support_phone', '+62 812 0000 1111')
                ->where('brand.logo_url', 'https://cdn.example.com/logo.png')
                ->where('brand.hero_title', 'Sewa Mobil Terpercaya')
            );
    }

    public function test_public_search_brand_falls_back_to_site_name_when_brand_name_blank(): void
    {
        Setting::query()->updateOrCreate(
            ['key' => 'general.site_name'],
            ['group' => 'general', 'value' => 'Contoh Rental', 'type' => 'string', 'label' => 'Site name', 'is_public' => true, 'sort_order' => 1],
        );

        $this->get(route('book.rental.search'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/Rental/Public/Search')
                ->where('brand.name', 'Contoh Rental')
                ->where('brand.color', RentalStorefrontSettings::DEFAULT_PRIMARY_COLOR)
            );
    }
}
