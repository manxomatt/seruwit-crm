<?php

namespace Tests\Feature\Modules\RentalStorefront;

use App\Models\Setting;
use App\Modules\Facades\Modules;
use App\Support\SystemRolePermissions;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Fleet\Models\Vehicle;
use Modules\RentalStorefront\RentalStorefrontModule;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class RentalStorefrontModuleTest extends TestCase
{
    use RefreshDatabase;
    use WithRoles;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
        $this->setUpRoles();
        SystemRolePermissions::seedRolesForModule('rental-storefront');
        SystemRolePermissions::syncAllSystemRoles();

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

    public function test_module_is_registered_with_correct_properties(): void
    {
        $module = Modules::find('rental-storefront');

        $this->assertNotNull($module);
        $this->assertInstanceOf(RentalStorefrontModule::class, $module);
        $this->assertSame('rental-storefront', $module->key());
        $this->assertEquals(['rental'], $module->requires());
        $this->assertContains('view', $module->permissions());
        $this->assertContains('manage_storefront', $module->permissions());
    }

    public function test_public_rental_search_is_accessible_to_guests(): void
    {
        $response = $this->get(route('book.rental.search'));

        $response->assertOk();
    }

    public function test_public_rental_track_lookup_is_accessible_to_guests(): void
    {
        $response = $this->get(route('book.rental.track'));

        $response->assertOk();
    }

    public function test_customer_portal_login_page_is_accessible_to_guests(): void
    {
        $response = $this->get(route('book.rental.login'));

        $response->assertOk();
    }

    public function test_public_vehicle_detail_page_loads_for_active_vehicle(): void
    {
        $vehicle = Vehicle::factory()->create([
            'status' => Vehicle::STATUS_ACTIVE,
        ]);

        $response = $this->get(route('book.rental.vehicles.show', [
            'vehicle' => $vehicle->id,
            'start_date' => now()->addDay()->format('Y-m-d 09:00'),
            'end_date' => now()->addDays(2)->format('Y-m-d 09:00'),
        ]));

        $response->assertOk();
    }
}
