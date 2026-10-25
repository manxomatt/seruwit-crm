<?php

namespace Tests\Feature;

use App\Models\Setting;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class TenantDefaultHomepageTest extends TestCase
{
    public function test_central_homepage_renders_welcome_with_is_tenant_false(): void
    {
        $response = $this->get('/');

        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Welcome')
            ->where('isTenant', false)
            ->has('settings')
        );
    }

    public function test_tenant_default_homepage_renders_with_tenant_rental_data(): void
    {
        $response = $this->get('/?preview_tenant=1');

        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Welcome')
            ->where('isTenant', true)
            ->has('tenantRentalData')
            ->has('tenantRentalData.brand')
            ->has('tenantRentalData.brand.name')
            ->has('tenantRentalData.brand.tagline')
            ->has('tenantRentalData.brand.description')
            ->has('tenantRentalData.brand.business_hours')
            ->has('tenantRentalData.brand.address')
            ->has('tenantRentalData.featuredVehicles')
            ->has('tenantRentalData.locations')
            ->has('tenantRentalData.classes')
            ->has('tenantRentalData.passengerBookingEnabled')
        );
    }

    public function test_tenant_default_homepage_custom_settings_are_reflected(): void
    {
        Setting::query()->updateOrCreate(
            ['key' => 'general.site_name'],
            [
                'value' => 'Nusantara Car Rental & Shuttle',
                'type' => 'string',
                'label' => 'Site Name',
                'is_public' => true,
                'group' => 'general',
            ]
        );

        Setting::query()->updateOrCreate(
            ['key' => 'site.phone'],
            [
                'value' => '082188889999',
                'type' => 'string',
                'label' => 'Phone',
                'is_public' => true,
                'group' => 'general',
            ]
        );

        $response = $this->get('/?preview_tenant=1');

        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Welcome')
            ->where('isTenant', true)
            ->where('tenantRentalData.brand.name', 'Nusantara Car Rental & Shuttle')
            ->where('tenantRentalData.brand.support_phone', '082188889999')
        );
    }
}
