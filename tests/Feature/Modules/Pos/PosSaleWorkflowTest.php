<?php

namespace Tests\Feature\Modules\Pos;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Inventory\Models\StockLevel;
use Modules\Inventory\Models\StockMovement;
use Modules\Inventory\Models\Warehouse;
use Modules\Pos\Models\PosPayment;
use Modules\Pos\Models\PosSale;
use Modules\Pos\Models\PosShift;
use Modules\Product\Models\Product;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class PosSaleWorkflowTest extends TestCase
{
    use RefreshDatabase, WithRoles;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
        $this->setUpRoles();
    }

    /**
     * @return array{store: Warehouse, product: Product, shift: PosShift}
     */
    private function seededShift(float $onHand = 50): array
    {
        $store = Warehouse::factory()->asStore()->create(['status' => 'active']);
        $store->createDefaultLocations();
        $location = $store->locations()->where('code', 'STOCK')->first();

        $product = Product::factory()->create([
            'category' => 'merchandise',
            'status' => 'active',
            'price' => 10000,
            'warehouse_id' => $store->id,
        ]);

        StockLevel::factory()->create([
            'product_id' => $product->id,
            'warehouse_id' => $store->id,
            'location_id' => $location->id,
            'batch_number' => 'LOT-POS-1',
            'expiry_date' => now()->addMonths(3)->toDateString(),
            'on_hand' => $onHand,
            'reserved' => 0,
        ]);

        $user = $this->createAdminUser();

        $shift = PosShift::query()->create([
            'warehouse_id' => $store->id,
            'opened_by' => $user->id,
            'status' => PosShift::STATUS_OPEN,
            'opening_float' => 100000,
            'opened_at' => now(),
        ]);

        return compact('store', 'product', 'shift') + ['user' => $user, 'location' => $location];
    }

    public function test_terminal_requires_open_shift(): void
    {
        $this->actingAs($this->createAdminUser())
            ->get(route('module.pos.terminal', [], false))
            ->assertRedirect(route('module.pos.shifts.index', ['open' => 1], false));
    }

    public function test_opening_shift_and_completing_cash_sale_deducts_stock(): void
    {
        ['store' => $store, 'product' => $product, 'user' => $user] = $this->seededShift(50);

        // Close the auto-created shift from helper and open via HTTP to cover the route.
        PosShift::query()->delete();

        $this->actingAs($user)
            ->post(route('module.pos.shifts.store', [], false), [
                'warehouse_id' => $store->id,
                'opening_float' => 50000,
            ])
            ->assertRedirect(route('module.pos.terminal', [], false));

        $shift = PosShift::query()->first();
        $this->assertNotNull($shift);
        $this->assertSame(PosShift::STATUS_OPEN, $shift->status);

        $this->actingAs($user)
            ->post(route('module.pos.sales.store', [], false), [
                'pos_shift_id' => $shift->id,
                'items' => [
                    ['product_id' => $product->id, 'quantity' => 2, 'unit_price' => 10000],
                ],
                'payment_method' => PosPayment::METHOD_CASH,
                'amount_tendered' => 25000,
            ])
            ->assertRedirect();

        $sale = PosSale::query()->first();
        $this->assertNotNull($sale);
        $this->assertSame(PosSale::STATUS_COMPLETED, $sale->status);
        $this->assertEquals(20000, (float) $sale->grand_total);
        $this->assertEquals(5000, (float) $sale->change_due);

        $this->assertDatabaseHas('stock_movements', [
            'product_id' => $product->id,
            'warehouse_id' => $store->id,
            'type' => 'out',
            'source_type' => 'pos_sale',
            'source_id' => $sale->id,
            'reference_code' => $sale->code,
        ]);

        $onHand = (float) StockLevel::query()
            ->where('product_id', $product->id)
            ->where('warehouse_id', $store->id)
            ->sum('on_hand');

        $this->assertEquals(48.0, $onHand);
    }

    public function test_voiding_sale_restores_stock(): void
    {
        ['store' => $store, 'product' => $product, 'shift' => $shift, 'user' => $user] = $this->seededShift(20);

        $this->actingAs($user)
            ->post(route('module.pos.sales.store', [], false), [
                'pos_shift_id' => $shift->id,
                'items' => [
                    ['product_id' => $product->id, 'quantity' => 3],
                ],
                'payment_method' => PosPayment::METHOD_QRIS,
            ])
            ->assertRedirect();

        $sale = PosSale::query()->first();
        $this->assertEquals(17.0, (float) StockLevel::query()
            ->where('product_id', $product->id)
            ->where('warehouse_id', $store->id)
            ->sum('on_hand'));

        $this->actingAs($user)
            ->post(route('module.pos.sales.void', $sale, false), [
                'void_reason' => 'Wrong item',
            ])
            ->assertRedirect(route('module.pos.sales.show', $sale, false));

        $this->assertSame(PosSale::STATUS_VOIDED, $sale->fresh()->status);
        $this->assertDatabaseHas('stock_movements', [
            'product_id' => $product->id,
            'type' => 'in',
            'source_type' => 'pos_sale_void',
            'source_id' => $sale->id,
        ]);

        $this->assertEquals(20.0, (float) StockLevel::query()
            ->where('product_id', $product->id)
            ->where('warehouse_id', $store->id)
            ->sum('on_hand'));
    }

    public function test_cannot_sell_more_than_available_stock(): void
    {
        ['product' => $product, 'shift' => $shift, 'user' => $user] = $this->seededShift(2);

        $this->actingAs($user)
            ->from(route('module.pos.terminal', [], false))
            ->post(route('module.pos.sales.store', [], false), [
                'pos_shift_id' => $shift->id,
                'items' => [
                    ['product_id' => $product->id, 'quantity' => 5],
                ],
                'payment_method' => PosPayment::METHOD_CASH,
                'amount_tendered' => 100000,
            ])
            ->assertRedirect()
            ->assertSessionHasErrors('cart');

        $this->assertSame(0, PosSale::query()->count());
        $this->assertSame(0, StockMovement::query()->where('source_type', 'pos_sale')->count());
    }

    public function test_closing_shift_records_cash_variance(): void
    {
        ['shift' => $shift, 'product' => $product, 'user' => $user] = $this->seededShift(10);

        $this->actingAs($user)->post(route('module.pos.sales.store', [], false), [
            'pos_shift_id' => $shift->id,
            'items' => [['product_id' => $product->id, 'quantity' => 1, 'unit_price' => 10000]],
            'payment_method' => PosPayment::METHOD_CASH,
            'amount_tendered' => 10000,
        ])->assertRedirect();

        // opening_float 100000 + cash sale 10000 = 110000 expected
        $this->actingAs($user)
            ->post(route('module.pos.shifts.close', $shift, false), [
                'closing_cash_counted' => 109500,
            ])
            ->assertRedirect(route('module.pos.shifts.show', $shift, false));

        $shift->refresh();
        $this->assertSame(PosShift::STATUS_CLOSED, $shift->status);
        $this->assertEquals(110000, (float) $shift->expected_cash);
        $this->assertEquals(-500, (float) $shift->cash_variance);
    }

    public function test_non_store_warehouse_cannot_open_shift(): void
    {
        $warehouse = Warehouse::factory()->create(['status' => 'active']);
        $user = $this->createAdminUser();

        $this->actingAs($user)
            ->from(route('module.pos.shifts.index', [], false))
            ->post(route('module.pos.shifts.store', [], false), [
                'warehouse_id' => $warehouse->id,
                'opening_float' => 0,
            ])
            ->assertRedirect()
            ->assertSessionHasErrors('warehouse_id');
    }
}
