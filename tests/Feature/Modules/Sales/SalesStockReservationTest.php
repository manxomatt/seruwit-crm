<?php

namespace Tests\Feature\Modules\Sales;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Inventory\Models\StockLevel;
use Modules\Inventory\Models\StockReservation;
use Modules\Inventory\Models\Warehouse;
use Modules\Inventory\Models\WarehouseLocation;
use Modules\Partners\Models\Partner;
use Modules\Product\Models\Product;
use Modules\Sales\Models\SalesOrder;
use Modules\Sales\Models\SalesOrderItem;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class SalesStockReservationTest extends TestCase
{
    use RefreshDatabase, WithRoles;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
        $this->setUpRoles();
    }

    public function test_confirming_sales_order_reserves_stock(): void
    {
        $user = $this->createAdminUser();
        $warehouse = Warehouse::factory()->create();
        $warehouse->createDefaultLocations();
        $location = WarehouseLocation::query()
            ->where('warehouse_id', $warehouse->id)
            ->where('code', 'STOCK')
            ->firstOrFail();

        $product = Product::factory()->create();
        $level = StockLevel::factory()->create([
            'product_id' => $product->id,
            'warehouse_id' => $warehouse->id,
            'location_id' => $location->id,
            'on_hand' => 100,
            'reserved' => 0,
        ]);

        $so = SalesOrder::factory()->create([
            'partner_id' => Partner::factory()->create(['customer_rank' => 1])->id,
            'warehouse_id' => $warehouse->id,
            'status' => SalesOrder::STATUS_DRAFT,
        ]);
        SalesOrderItem::factory()->create([
            'sales_order_id' => $so->id,
            'product_id' => $product->id,
            'quantity_ordered' => 25,
            'unit_price' => 1000,
        ]);
        $so->recalculateTotal();

        $this->actingAs($user)
            ->post(route('module.sales.sales-orders.confirm', $so, false))
            ->assertSessionHas('success');

        $this->assertEquals(25, (float) $level->fresh()->reserved);
        $this->assertEquals(100, (float) $level->fresh()->on_hand);
        $this->assertDatabaseHas('stock_reservations', [
            'sales_order_id' => $so->id,
            'product_id' => $product->id,
            'quantity' => 25,
            'status' => StockReservation::STATUS_OPEN,
        ]);
    }

    public function test_second_so_cannot_over_reserve_same_stock(): void
    {
        $user = $this->createAdminUser();
        $warehouse = Warehouse::factory()->create();
        $warehouse->createDefaultLocations();
        $location = WarehouseLocation::query()
            ->where('warehouse_id', $warehouse->id)
            ->where('code', 'STOCK')
            ->firstOrFail();

        $product = Product::factory()->create();
        StockLevel::factory()->create([
            'product_id' => $product->id,
            'warehouse_id' => $warehouse->id,
            'location_id' => $location->id,
            'on_hand' => 30,
            'reserved' => 0,
        ]);

        $customer = Partner::factory()->create(['customer_rank' => 1]);

        $so1 = SalesOrder::factory()->create([
            'partner_id' => $customer->id,
            'warehouse_id' => $warehouse->id,
            'status' => SalesOrder::STATUS_DRAFT,
        ]);
        SalesOrderItem::factory()->create([
            'sales_order_id' => $so1->id,
            'product_id' => $product->id,
            'quantity_ordered' => 20,
            'unit_price' => 100,
        ]);
        $so1->recalculateTotal();

        $so2 = SalesOrder::factory()->create([
            'partner_id' => $customer->id,
            'warehouse_id' => $warehouse->id,
            'status' => SalesOrder::STATUS_DRAFT,
        ]);
        SalesOrderItem::factory()->create([
            'sales_order_id' => $so2->id,
            'product_id' => $product->id,
            'quantity_ordered' => 20,
            'unit_price' => 100,
        ]);
        $so2->recalculateTotal();

        $this->actingAs($user)
            ->post(route('module.sales.sales-orders.confirm', $so1, false))
            ->assertSessionHas('success');

        $this->actingAs($user)
            ->post(route('module.sales.sales-orders.confirm', $so2, false))
            ->assertSessionHas('error');

        $this->assertSame(SalesOrder::STATUS_DRAFT, $so2->fresh()->status);
    }

    public function test_cancelling_confirmed_so_releases_reservation(): void
    {
        $user = $this->createAdminUser();
        $warehouse = Warehouse::factory()->create();
        $warehouse->createDefaultLocations();
        $location = WarehouseLocation::query()
            ->where('warehouse_id', $warehouse->id)
            ->where('code', 'STOCK')
            ->firstOrFail();

        $product = Product::factory()->create();
        $level = StockLevel::factory()->create([
            'product_id' => $product->id,
            'warehouse_id' => $warehouse->id,
            'location_id' => $location->id,
            'on_hand' => 80,
            'reserved' => 0,
        ]);

        $so = SalesOrder::factory()->create([
            'partner_id' => Partner::factory()->create(['customer_rank' => 1])->id,
            'warehouse_id' => $warehouse->id,
            'status' => SalesOrder::STATUS_DRAFT,
        ]);
        SalesOrderItem::factory()->create([
            'sales_order_id' => $so->id,
            'product_id' => $product->id,
            'quantity_ordered' => 15,
            'unit_price' => 100,
        ]);
        $so->recalculateTotal();

        $this->actingAs($user)
            ->post(route('module.sales.sales-orders.confirm', $so, false))
            ->assertSessionHas('success');

        $this->assertEquals(15, (float) $level->fresh()->reserved);

        $this->actingAs($user)
            ->post(route('module.sales.sales-orders.cancel', $so, false))
            ->assertSessionHas('success');

        $this->assertEquals(0, (float) $level->fresh()->reserved);
        $this->assertSame(SalesOrder::STATUS_CANCELLED, $so->fresh()->status);
    }
}
