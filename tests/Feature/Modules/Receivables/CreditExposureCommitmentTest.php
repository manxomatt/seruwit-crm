<?php

namespace Tests\Feature\Modules\Receivables;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Inventory\Models\StockLevel;
use Modules\Inventory\Models\Warehouse;
use Modules\Inventory\Models\WarehouseLocation;
use Modules\Partners\Models\Partner;
use Modules\Product\Models\Product;
use Modules\Receivables\Support\CreditLimitChecker;
use Modules\Sales\Models\SalesOrder;
use Modules\Sales\Models\SalesOrderItem;
use Modules\Sales\Support\SalesOrderConfirmationService;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class CreditExposureCommitmentTest extends TestCase
{
    use RefreshDatabase, WithRoles;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
        $this->setUpRoles();
    }

    public function test_open_sales_orders_count_toward_credit_exposure(): void
    {
        $partner = Partner::factory()->create([
            'customer_rank' => 1,
            'credit_limit' => 100_000,
        ]);

        $warehouse = Warehouse::factory()->create();
        $warehouse->createDefaultLocations();
        $stock = WarehouseLocation::query()
            ->where('warehouse_id', $warehouse->id)
            ->where('code', 'STOCK')
            ->firstOrFail();

        $product = Product::factory()->create();
        StockLevel::factory()->create([
            'product_id' => $product->id,
            'warehouse_id' => $warehouse->id,
            'location_id' => $stock->id,
            'on_hand' => 500,
            'reserved' => 0,
        ]);

        $so = SalesOrder::factory()->create([
            'partner_id' => $partner->id,
            'warehouse_id' => $warehouse->id,
            'status' => SalesOrder::STATUS_DRAFT,
        ]);
        SalesOrderItem::factory()->create([
            'sales_order_id' => $so->id,
            'product_id' => $product->id,
            'quantity_ordered' => 80,
            'unit_price' => 1000,
        ]);
        $so->recalculateTotal();
        app(SalesOrderConfirmationService::class)->confirm($so);

        $this->assertEquals(80_000, CreditLimitChecker::openSalesCommitment((int) $partner->id));
        $this->assertEquals(80_000, CreditLimitChecker::outstandingFor($partner));
        $this->assertTrue(CreditLimitChecker::wouldExceed($partner, 30_000));
        $this->assertFalse(CreditLimitChecker::wouldExceed($partner, 10_000));

        $snapshot = CreditLimitChecker::snapshot($partner);
        $this->assertEquals(0, $snapshot['ar_outstanding']);
        $this->assertEquals(80_000, $snapshot['sales_commitment']);
    }

    public function test_invoice_issue_gate_ignores_sales_commitment(): void
    {
        $partner = Partner::factory()->create([
            'customer_rank' => 1,
            'credit_limit' => 100_000,
        ]);

        $warehouse = Warehouse::factory()->create();
        $warehouse->createDefaultLocations();
        $stock = WarehouseLocation::query()
            ->where('warehouse_id', $warehouse->id)
            ->where('code', 'STOCK')
            ->firstOrFail();

        $product = Product::factory()->create();
        StockLevel::factory()->create([
            'product_id' => $product->id,
            'warehouse_id' => $warehouse->id,
            'location_id' => $stock->id,
            'on_hand' => 500,
            'reserved' => 0,
        ]);

        $so = SalesOrder::factory()->create([
            'partner_id' => $partner->id,
            'warehouse_id' => $warehouse->id,
            'status' => SalesOrder::STATUS_DRAFT,
        ]);
        SalesOrderItem::factory()->create([
            'sales_order_id' => $so->id,
            'product_id' => $product->id,
            'quantity_ordered' => 80,
            'unit_price' => 1000,
        ]);
        $so->recalculateTotal();
        app(SalesOrderConfirmationService::class)->confirm($so);

        $partner->update(['credit_limit' => 50_000]);
        $partner->refresh();

        $this->assertTrue(CreditLimitChecker::wouldExceed($partner, 0));
        $this->assertFalse(CreditLimitChecker::wouldExceed(
            $partner,
            10_000,
            includeSalesCommitment: false,
        ));
    }
}
