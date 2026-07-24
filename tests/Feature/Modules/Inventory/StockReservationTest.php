<?php

namespace Tests\Feature\Modules\Inventory;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Inventory\Models\StockLevel;
use Modules\Inventory\Models\StockReservation;
use Modules\Inventory\Models\Warehouse;
use Modules\Orders\Models\DeliveryOrder;
use Modules\Orders\Models\DeliveryOrderItem;
use Modules\Product\Models\Product;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class StockReservationTest extends TestCase
{
    use RefreshDatabase, WithRoles;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
        $this->setUpRoles();
    }

    /**
     * @return array{warehouse: Warehouse, product: Product, order: DeliveryOrder, level: StockLevel}
     */
    private function draftOrderWithStock(float $onHand = 100, float $orderQty = 20): array
    {
        $warehouse = Warehouse::factory()->create(['status' => 'active']);
        $product = Product::factory()->create([
            'category' => 'merchandise',
            'warehouse_id' => $warehouse->id,
        ]);

        $level = StockLevel::factory()->create([
            'product_id' => $product->id,
            'warehouse_id' => $warehouse->id,
            'location_id' => null,
            'batch_number' => '',
            'on_hand' => $onHand,
            'reserved' => 0,
        ]);

        $order = DeliveryOrder::factory()->create(['status' => DeliveryOrder::STATUS_DRAFT]);
        DeliveryOrderItem::factory()->create([
            'delivery_order_id' => $order->id,
            'product_id' => $product->id,
            'quantity' => $orderQty,
        ]);

        return compact('warehouse', 'product', 'order', 'level');
    }

    public function test_confirming_order_reserves_stock(): void
    {
        ['order' => $order, 'level' => $level, 'product' => $product] = $this->draftOrderWithStock(100, 20);

        $this->actingAs($this->createAdminUser())
            ->post(route('module.orders.confirm', $order))
            ->assertSessionHas('success');

        $this->assertSame(DeliveryOrder::STATUS_CONFIRMED, $order->fresh()->status);
        $this->assertEquals(20, (float) $level->fresh()->reserved);
        $this->assertEquals(100, (float) $level->fresh()->on_hand);
        $this->assertEquals(80, (float) $level->fresh()->available);

        $this->assertDatabaseHas('stock_reservations', [
            'delivery_order_id' => $order->id,
            'product_id' => $product->id,
            'quantity' => 20,
            'status' => StockReservation::STATUS_OPEN,
        ]);
    }

    public function test_confirm_fails_when_available_stock_is_insufficient(): void
    {
        ['order' => $order, 'level' => $level] = $this->draftOrderWithStock(5, 20);

        $this->actingAs($this->createAdminUser())
            ->post(route('module.orders.confirm', $order))
            ->assertSessionHasErrors();

        $this->assertSame(DeliveryOrder::STATUS_DRAFT, $order->fresh()->status);
        $this->assertEquals(0, (float) $level->fresh()->reserved);
    }

    public function test_cancelling_confirmed_order_releases_reservation(): void
    {
        ['order' => $order, 'level' => $level] = $this->draftOrderWithStock(50, 15);

        $this->actingAs($this->createAdminUser())
            ->post(route('module.orders.confirm', $order))
            ->assertSessionHas('success');

        $this->actingAs($this->createAdminUser())
            ->post(route('module.orders.cancel', $order), ['cancelled_reason' => 'Customer cancelled'])
            ->assertSessionHas('success');

        $this->assertSame(DeliveryOrder::STATUS_CANCELLED, $order->fresh()->status);
        $this->assertEquals(0, (float) $level->fresh()->reserved);
        $this->assertEquals(50, (float) $level->fresh()->on_hand);
    }

    public function test_fulfilling_order_releases_reservation_and_reduces_on_hand(): void
    {
        ['order' => $order, 'level' => $level, 'product' => $product] = $this->draftOrderWithStock(80, 25);

        $this->actingAs($this->createAdminUser())
            ->post(route('module.orders.confirm', $order))
            ->assertSessionHas('success');

        $order->update([
            'status' => DeliveryOrder::STATUS_IN_TRANSIT,
        ]);

        \Modules\Orders\Support\DeliveryOrderStock::fulfill($order->fresh());

        $level->refresh();
        $this->assertEquals(0, (float) $level->reserved);
        $this->assertEquals(55, (float) $level->on_hand);

        $this->assertDatabaseHas('stock_movements', [
            'product_id' => $product->id,
            'type' => 'out',
            'source_type' => 'delivery_fulfillment',
            'quantity' => 25,
        ]);

        $this->assertSame(
            StockReservation::STATUS_CLOSED,
            StockReservation::query()->where('delivery_order_id', $order->id)->value('status')
        );
    }

    public function test_second_confirm_does_not_double_reserve(): void
    {
        ['order' => $order, 'level' => $level] = $this->draftOrderWithStock(100, 10);

        $this->actingAs($this->createAdminUser())->post(route('module.orders.confirm', $order));

        \Modules\Inventory\Support\StockReservationService::reserveOrder($order->fresh());

        $this->assertEquals(10, (float) $level->fresh()->reserved);
        $this->assertSame(1, StockReservation::query()->where('delivery_order_id', $order->id)->count());
    }
}
