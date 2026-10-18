<?php

namespace Tests\Feature\Modules\Rental;

use Illuminate\Foundation\Testing\DatabaseTransactions;
use Modules\Fleet\Models\Vehicle;
use Modules\Rental\Models\Rental;
use Modules\Rental\Models\RentalAddon;
use Modules\Rental\Support\RentalAddonCatalog;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class RentalCustomAddonCatalogTest extends TestCase
{
    use DatabaseTransactions;
    use WithRoles;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
        $this->setUpRoles();
    }

    public function test_admin_can_view_addons_tab_in_rental_settings(): void
    {
        $admin = $this->createAdminUser();

        $response = $this->actingAs($admin)
            ->get(route('module.rental.settings.index', ['tab' => 'addons']));

        $response->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/Rental/Settings/Index')
                ->where('tab', 'addons')
                ->has('addons')
            );
    }

    public function test_admin_can_create_new_custom_addon(): void
    {
        $admin = $this->createAdminUser();

        $payload = [
            'code' => 'wifi_router',
            'name' => 'Portable 4G Wi-Fi Router',
            'category' => 'comfort',
            'description' => 'Unlimited high-speed 4G mobile Wi-Fi hotspot up to 5 devices.',
            'icon' => 'wifi',
            'price_type' => 'daily',
            'price' => 45000,
            'max_quantity' => 2,
            'is_active' => true,
            'sort_order' => 10,
        ];

        $response = $this->actingAs($admin)
            ->post(route('module.rental.settings.addons.store'), $payload);

        $response->assertRedirect()
            ->assertSessionHas('success');

        $this->assertDatabaseHas('rental_addons', [
            'code' => 'wifi_router',
            'name' => 'Portable 4G Wi-Fi Router',
            'category' => 'comfort',
            'price' => 45000,
            'is_active' => true,
        ]);
    }

    public function test_admin_can_update_addon(): void
    {
        $admin = $this->createAdminUser();

        $addon = RentalAddon::query()->create([
            'code' => 'camping_chair',
            'name' => 'Kursi Lipat Camping',
            'category' => 'accessory',
            'description' => 'Kursi lipat santai outdoor.',
            'icon' => 'box',
            'price_type' => 'daily',
            'price' => 15000,
            'max_quantity' => 4,
            'is_active' => true,
            'sort_order' => 5,
        ]);

        $response = $this->actingAs($admin)
            ->patch(route('module.rental.settings.addons.update', $addon), [
                'name' => 'Kursi Lipat Premium',
                'category' => 'accessory',
                'description' => 'Kursi lipat santai outdoor premium.',
                'icon' => 'star',
                'price_type' => 'flat',
                'price' => 30000,
                'max_quantity' => 4,
                'is_active' => true,
                'sort_order' => 6,
            ]);

        $response->assertRedirect()
            ->assertSessionHas('success');

        $addon->refresh();
        $this->assertSame('Kursi Lipat Premium', $addon->name);
        $this->assertSame('flat', $addon->price_type);
        $this->assertEquals(30000, (float) $addon->price);
    }

    public function test_admin_can_toggle_addon_active_status(): void
    {
        $admin = $this->createAdminUser();

        $addon = RentalAddon::query()->create([
            'code' => 'test_toggle',
            'name' => 'Test Toggle Addon',
            'category' => 'accessory',
            'price_type' => 'daily',
            'price' => 10000,
            'max_quantity' => 1,
            'is_active' => true,
            'sort_order' => 99,
        ]);

        $this->actingAs($admin)
            ->patch(route('module.rental.settings.addons.toggle', $addon))
            ->assertRedirect();

        $this->assertFalse($addon->fresh()->is_active);

        $this->actingAs($admin)
            ->patch(route('module.rental.settings.addons.toggle', $addon))
            ->assertRedirect();

        $this->assertTrue($addon->fresh()->is_active);
    }

    public function test_admin_can_delete_addon(): void
    {
        $admin = $this->createAdminUser();

        $addon = RentalAddon::query()->create([
            'code' => 'addon_to_delete',
            'name' => 'Addon To Delete',
            'category' => 'accessory',
            'price_type' => 'daily',
            'price' => 20000,
            'max_quantity' => 1,
            'is_active' => true,
            'sort_order' => 99,
        ]);

        $response = $this->actingAs($admin)
            ->delete(route('module.rental.settings.addons.destroy', $addon));

        $response->assertRedirect()
            ->assertSessionHas('success');

        $this->assertDatabaseMissing('rental_addons', [
            'id' => $addon->id,
        ]);
    }

    public function test_dynamic_addon_appears_in_rental_addon_catalog(): void
    {
        $addon = RentalAddon::query()->create([
            'code' => 'drone_camera',
            'name' => 'Drone Kamera Aerial 4K',
            'category' => 'accessory',
            'description' => 'Drone untuk video dokumentasi.',
            'icon' => 'camera',
            'price_type' => 'daily',
            'price' => 125000,
            'max_quantity' => 1,
            'is_active' => true,
            'sort_order' => 1,
        ]);

        $this->assertContains('drone_camera', RentalAddonCatalog::codes());
        $this->assertSame('Drone Kamera Aerial 4K', RentalAddonCatalog::label('drone_camera'));

        $vehicle = Vehicle::factory()->create();
        $rental = Rental::factory()->create([
            'vehicle_id' => $vehicle->id,
            'total_periods' => 3,
            'service_type' => Rental::SERVICE_SELF_DRIVE,
        ]);

        $catalog = RentalAddonCatalog::selfServiceCatalog($rental);
        $droneItem = collect($catalog)->firstWhere('code', 'drone_camera');

        $this->assertNotNull($droneItem);
        $this->assertSame('Drone Kamera Aerial 4K', $droneItem['name']);
        $this->assertEquals(125000, (float) $droneItem['unit_price']);
        $this->assertEquals(375000, (float) $droneItem['calculated_total']); // 125,000 * 3 days
    }
}
