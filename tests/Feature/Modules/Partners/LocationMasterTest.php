<?php

namespace Tests\Feature\Modules\Partners;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Billing\Models\OrderCharge;
use Modules\Billing\Models\Tariff;
use Modules\Orders\Models\DeliveryOrder;
use Modules\Orders\Models\DeliveryOrderItem;
use Modules\Partners\Models\Location;
use Modules\Partners\Models\Partner;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class LocationMasterTest extends TestCase
{
    use RefreshDatabase;
    use WithRoles;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
        $this->setUpRoles();
    }

    public function test_locations_index_renders_and_location_can_be_created(): void
    {
        $user = $this->createAdminUser();

        $this->actingAs($user)
            ->get(route('module.partners.locations.index'))
            ->assertOk();

        $this->actingAs($user)
            ->post(route('module.partners.locations.store'), [
                'name' => 'Gudang Pusat',
                'address' => 'Jl. Merdeka 1',
                'city' => 'Jakarta',
                'latitude' => -6.1751,
                'longitude' => 106.8650,
            ])
            ->assertRedirect(route('module.partners.locations.index'))
            ->assertSessionHas('success');

        $this->assertDatabaseHas('locations', [
            'name' => 'Gudang Pusat',
            'city' => 'Jakarta',
        ]);
    }

    public function test_confirming_an_order_matches_tariff_by_location_ids(): void
    {
        $origin = Location::factory()->create(['name' => 'Gudang A']);
        $destination = Location::factory()->create(['name' => 'Toko B']);
        $tariff = Tariff::factory()->create([
            'origin' => 'Legacy Text Origin',
            'destination' => 'Legacy Text Destination',
            'origin_location_id' => $origin->id,
            'destination_location_id' => $destination->id,
            'price' => 450000,
        ]);

        $order = DeliveryOrder::factory()->create([
            'pickup_address' => 'Something else entirely',
            'delivery_address' => 'Also unrelated',
            'pickup_location_id' => $origin->id,
            'delivery_location_id' => $destination->id,
        ]);

        DeliveryOrderItem::factory()->create(['delivery_order_id' => $order->id]);

        $this->actingAs($this->createAdminUser())
            ->post(route('module.orders.confirm', $order));

        $charge = OrderCharge::firstWhere('delivery_order_id', $order->id);
        $this->assertNotNull($charge);
        $this->assertSame($tariff->id, $charge->tariff_id);
        $this->assertSame('450000.00', $charge->amount);
    }

    public function test_creating_a_delivery_order_with_locations_fills_address_and_coordinates(): void
    {
        $user = $this->createAdminUser();
        $partner = Partner::factory()->create();
        $origin = Location::factory()->create([
            'name' => 'Depot',
            'address' => 'Jl. Depot 9',
            'city' => 'Bekasi',
            'latitude' => -6.2383,
            'longitude' => 106.9756,
        ]);
        $destination = Location::factory()->create([
            'name' => 'Outlet',
            'address' => 'Jl. Outlet 2',
            'city' => 'Depok',
            'latitude' => -6.4025,
            'longitude' => 106.7942,
        ]);

        $this->actingAs($user)
            ->post(route('module.orders.store'), [
                'partner_id' => $partner->id,
                'order_date' => now()->toDateString(),
                'pickup_location_id' => $origin->id,
                'delivery_location_id' => $destination->id,
            ])
            ->assertRedirect();

        $order = DeliveryOrder::query()->latest('id')->first();
        $this->assertNotNull($order);
        $this->assertSame($origin->id, $order->pickup_location_id);
        $this->assertSame($destination->id, $order->delivery_location_id);
        $this->assertStringContainsString('Jl. Depot 9', $order->pickup_address);
        $this->assertStringContainsString('Jl. Outlet 2', $order->delivery_address);
        $this->assertSame('-6.4025000', $order->delivery_lat);
        $this->assertSame('106.7942000', $order->delivery_lng);
    }

    public function test_customer_specific_location_tariff_wins_over_general(): void
    {
        $partner = Partner::factory()->create();
        $origin = Location::factory()->create();
        $destination = Location::factory()->create();

        Tariff::factory()->create([
            'origin_location_id' => $origin->id,
            'destination_location_id' => $destination->id,
            'origin' => $origin->name,
            'destination' => $destination->name,
            'price' => 500000,
        ]);
        $specific = Tariff::factory()->forCustomer($partner)->create([
            'origin_location_id' => $origin->id,
            'destination_location_id' => $destination->id,
            'origin' => $origin->name,
            'destination' => $destination->name,
            'price' => 350000,
        ]);

        $order = DeliveryOrder::factory()->create([
            'partner_id' => $partner->id,
            'pickup_location_id' => $origin->id,
            'delivery_location_id' => $destination->id,
            'pickup_address' => $origin->name,
            'delivery_address' => $destination->name,
        ]);
        DeliveryOrderItem::factory()->create(['delivery_order_id' => $order->id]);

        $this->actingAs($this->createAdminUser())
            ->post(route('module.orders.confirm', $order));

        $charge = OrderCharge::firstWhere('delivery_order_id', $order->id);
        $this->assertSame($specific->id, $charge->tariff_id);
        $this->assertSame('350000.00', $charge->amount);
    }
}
