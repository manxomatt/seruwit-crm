<?php

namespace Tests\Feature\Modules\Orders;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Orders\Models\DeliveryOrder;
use Modules\Orders\Models\DeliveryOrderItem;
use Modules\Product\Models\Product;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class DeliveryOrderItemTest extends TestCase
{
    use RefreshDatabase;
    use WithRoles;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
        $this->setUpRoles();
    }

    public function test_an_item_can_be_added_and_removed_while_the_order_is_a_draft(): void
    {
        $user = $this->createAdminUser();
        $order = DeliveryOrder::factory()->create();
        $product = Product::factory()->create();

        $this->actingAs($user)->post(route('module.orders.items.store', $order), [
            'product_id' => $product->id,
            'quantity' => 5,
            'notes' => 'Fragile',
        ])->assertRedirect(route('module.orders.show', $order));

        $this->assertDatabaseHas('delivery_order_items', ['delivery_order_id' => $order->id, 'product_id' => $product->id]);

        $item = $order->items()->first();
        $this->actingAs($user)->delete(route('module.orders.items.destroy', [$order, $item]))
            ->assertRedirect(route('module.orders.show', $order));

        $this->assertDatabaseMissing('delivery_order_items', ['id' => $item->id]);
    }

    public function test_items_cannot_be_changed_once_the_order_is_confirmed(): void
    {
        $user = $this->createAdminUser();
        $order = DeliveryOrder::factory()->confirmed()->create();
        $product = Product::factory()->create();
        $item = DeliveryOrderItem::factory()->create(['delivery_order_id' => $order->id]);

        $this->actingAs($user)->post(route('module.orders.items.store', $order), [
            'product_id' => $product->id,
            'quantity' => 5,
        ])->assertSessionHas('error');

        $this->actingAs($user)->delete(route('module.orders.items.destroy', [$order, $item]))
            ->assertSessionHas('error');

        $this->assertDatabaseHas('delivery_order_items', ['id' => $item->id]);
    }

    public function test_an_item_belonging_to_another_order_returns_404(): void
    {
        $user = $this->createAdminUser();
        $order = DeliveryOrder::factory()->create();
        $otherItem = DeliveryOrderItem::factory()->create();

        $this->actingAs($user)->delete(route('module.orders.items.destroy', [$order, $otherItem]))
            ->assertNotFound();
    }

    public function test_deleting_an_order_cascades_its_items(): void
    {
        $user = $this->createAdminUser();
        $order = DeliveryOrder::factory()->create();
        $item = DeliveryOrderItem::factory()->create(['delivery_order_id' => $order->id]);

        $this->actingAs($user)->delete(route('module.orders.destroy', $order));

        $this->assertDatabaseMissing('delivery_order_items', ['id' => $item->id]);
    }
}
