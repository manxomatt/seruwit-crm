<?php

namespace Tests\Feature\Modules\Transportation;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Product\Models\Product;
use Modules\TransportationManagement\Models\Trip;
use Modules\TransportationManagement\Models\TripItem;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class TripItemTest extends TestCase
{
    use RefreshDatabase;
    use WithRoles;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
        $this->setUpRoles();
    }

    public function test_a_cargo_item_can_be_added_and_removed_from_a_trip(): void
    {
        $user = $this->createAdminUser();
        $trip = Trip::factory()->create();
        $product = Product::factory()->create();

        $this->actingAs($user)->post(route('module.transportation.trips.items.store', $trip), [
            'product_id' => $product->id,
            'quantity' => 12.5,
            'notes' => 'Handle with care',
        ])->assertRedirect(route('module.transportation.trips.show', $trip));

        $this->assertDatabaseHas('trip_items', ['trip_id' => $trip->id, 'product_id' => $product->id]);

        $item = $trip->items()->first();
        $this->actingAs($user)->delete(route('module.transportation.trips.items.destroy', [$trip, $item]))
            ->assertRedirect(route('module.transportation.trips.show', $trip));

        $this->assertDatabaseMissing('trip_items', ['id' => $item->id]);
    }

    public function test_adding_a_cargo_item_requires_a_valid_product_and_quantity(): void
    {
        $user = $this->createAdminUser();
        $trip = Trip::factory()->create();

        $this->actingAs($user)->post(route('module.transportation.trips.items.store', $trip), [
            'product_id' => 999999,
            'quantity' => 0,
        ])->assertSessionHasErrors(['product_id', 'quantity']);
    }

    public function test_deleting_a_trip_cascades_its_cargo_items(): void
    {
        $user = $this->createAdminUser();
        $trip = Trip::factory()->create();
        $item = TripItem::factory()->create(['trip_id' => $trip->id]);

        $this->actingAs($user)->delete(route('module.transportation.trips.destroy', $trip))
            ->assertRedirect(route('module.transportation.trips.index'));

        $this->assertDatabaseMissing('trip_items', ['id' => $item->id]);
    }
}
