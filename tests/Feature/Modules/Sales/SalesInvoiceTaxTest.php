<?php

namespace Tests\Feature\Modules\Sales;

use App\Models\Setting;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;
use Modules\Inventory\Models\StockLevel;
use Modules\Inventory\Models\Warehouse;
use Modules\Inventory\Models\WarehouseLocation;
use Modules\Invoicing\Models\Invoice;
use Modules\Partners\Models\Partner;
use Modules\Product\Models\Product;
use Modules\Sales\Models\SalesOrder;
use Modules\Sales\Models\SalesOrderItem;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class SalesInvoiceTaxTest extends TestCase
{
    use RefreshDatabase, WithRoles;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
        $this->setUpRoles();
    }

    public function test_invoice_from_gin_applies_tax_from_settings(): void
    {
        if (! Schema::hasTable('invoices')) {
            $this->markTestSkipped('Invoicing tables are not available.');
        }

        Setting::query()->updateOrCreate(
            ['key' => 'ecommerce.tax_enabled'],
            ['group' => 'ecommerce', 'value' => '1', 'type' => 'boolean', 'label' => 'Enable Tax']
        );
        Setting::query()->updateOrCreate(
            ['key' => 'ecommerce.tax_rate'],
            ['group' => 'ecommerce', 'value' => '11', 'type' => 'number', 'label' => 'Tax Rate']
        );

        $user = $this->createAdminUser();
        $warehouse = Warehouse::factory()->create();
        $warehouse->createDefaultLocations();
        $stockLocation = WarehouseLocation::query()
            ->where('warehouse_id', $warehouse->id)
            ->where('code', 'STOCK')
            ->firstOrFail();

        $customer = Partner::factory()->create(['customer_rank' => 1]);
        $product = Product::factory()->create();

        StockLevel::factory()->create([
            'product_id' => $product->id,
            'warehouse_id' => $warehouse->id,
            'location_id' => $stockLocation->id,
            'on_hand' => 100,
            'reserved' => 0,
        ]);

        $so = SalesOrder::factory()->create([
            'partner_id' => $customer->id,
            'warehouse_id' => $warehouse->id,
            'status' => SalesOrder::STATUS_DRAFT,
        ]);

        $item = SalesOrderItem::factory()->create([
            'sales_order_id' => $so->id,
            'product_id' => $product->id,
            'quantity_ordered' => 10,
            'unit_price' => 1000,
        ]);
        $so->recalculateTotal();

        $this->actingAs($user)
            ->post(route('module.sales.sales-orders.confirm', $so, false))
            ->assertSessionHas('success');

        $this->actingAs($user)->post(route('module.sales.sales-orders.gin.store', $so, false), [
            'warehouse_id' => $warehouse->id,
            'issued_at' => now()->toDateString(),
            'confirm' => true,
            'items' => [
                ['so_item_id' => $item->id, 'quantity_issued' => 10, 'location_id' => $stockLocation->id],
            ],
        ])->assertSessionHas('success');

        $this->actingAs($user)
            ->post(route('module.sales.sales-orders.invoice', $so, false))
            ->assertRedirect();

        $invoice = Invoice::query()->latest('id')->first();
        $this->assertNotNull($invoice);
        $this->assertTrue($invoice->tax_enabled);
        $this->assertEquals(11, (float) $invoice->tax_rate);
        $this->assertEquals(10000, (float) $invoice->subtotal);
        $this->assertEquals(1100, (float) $invoice->tax_amount);
        $this->assertEquals(11100, (float) $invoice->total);
    }
}
