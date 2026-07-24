<?php

namespace Tests\Feature\Modules\Inventory;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Inventory\Models\StockLevel;
use Modules\Inventory\Models\StockMovement;
use Modules\Inventory\Models\Warehouse;
use Modules\Inventory\Support\StockMovementRecorder;
use Modules\Product\Models\Product;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class StockTransferTest extends TestCase
{
    use RefreshDatabase, WithRoles;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
        $this->setUpRoles();
    }

    public function test_transfer_creates_out_and_in_with_shared_reference(): void
    {
        $from = Warehouse::factory()->create(['name' => 'Gudang A']);
        $to = Warehouse::factory()->create(['name' => 'Gudang B']);
        $product = Product::factory()->create();

        StockMovementRecorder::record([
            'product_id' => $product->id,
            'warehouse_id' => $from->id,
            'type' => 'in',
            'quantity' => 100,
            'source_type' => 'manual',
            'recorded_at' => now(),
        ]);

        $user = $this->createAdminUser();

        $this->actingAs($user)->post(route('module.inventory.stock-movements.transfer.store', [], false), [
            'product_id' => $product->id,
            'from_warehouse_id' => $from->id,
            'to_warehouse_id' => $to->id,
            'quantity' => 40,
            'notes' => 'Pindah stok demo',
        ])->assertRedirect(route('module.inventory.stock-movements.index', [], false));

        $movements = StockMovement::query()
            ->where('source_type', 'transfer')
            ->orderBy('id')
            ->get();

        $this->assertCount(2, $movements);
        $this->assertSame('out', $movements[0]->type);
        $this->assertSame('in', $movements[1]->type);
        $this->assertSame($movements[0]->reference_code, $movements[1]->reference_code);
        $this->assertMatchesRegularExpression('/^TRF-\d{4}-\d{4}$/', $movements[0]->reference_code);
        $this->assertEquals(40, (float) $movements[0]->quantity);
        $this->assertEquals(40, (float) $movements[1]->quantity);

        $this->assertEquals(60, (float) StockLevel::query()
            ->where('product_id', $product->id)
            ->where('warehouse_id', $from->id)
            ->whereNull('location_id')
            ->value('on_hand'));

        $this->assertEquals(40, (float) StockLevel::query()
            ->where('product_id', $product->id)
            ->where('warehouse_id', $to->id)
            ->whereNull('location_id')
            ->value('on_hand'));
    }

    public function test_transfer_rejects_insufficient_stock(): void
    {
        $from = Warehouse::factory()->create();
        $to = Warehouse::factory()->create();
        $product = Product::factory()->create();

        StockLevel::factory()->create([
            'product_id' => $product->id,
            'warehouse_id' => $from->id,
            'location_id' => null,
            'on_hand' => 10,
            'reserved' => 0,
        ]);

        $this->actingAs($this->createAdminUser())->post(route('module.inventory.stock-movements.transfer.store', [], false), [
            'product_id' => $product->id,
            'from_warehouse_id' => $from->id,
            'to_warehouse_id' => $to->id,
            'quantity' => 25,
        ])->assertSessionHasErrors('quantity');

        $this->assertEquals(0, StockMovement::query()->where('source_type', 'transfer')->count());
    }

    public function test_transfer_rejects_same_warehouse(): void
    {
        $warehouse = Warehouse::factory()->create();
        $product = Product::factory()->create();

        $this->actingAs($this->createAdminUser())->post(route('module.inventory.stock-movements.transfer.store', [], false), [
            'product_id' => $product->id,
            'from_warehouse_id' => $warehouse->id,
            'to_warehouse_id' => $warehouse->id,
            'quantity' => 5,
        ])->assertSessionHasErrors('from_warehouse_id');
    }

    public function test_transfer_create_page_is_reachable(): void
    {
        Warehouse::factory()->count(2)->create(['status' => 'active']);

        $this->actingAs($this->createAdminUser())
            ->get(route('module.inventory.stock-movements.transfer.create', [], false))
            ->assertOk();
    }
}
