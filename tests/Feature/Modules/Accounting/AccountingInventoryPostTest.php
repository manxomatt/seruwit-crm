<?php

namespace Tests\Feature\Modules\Accounting;

use App\Models\Setting;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Accounting\Models\Account;
use Modules\Accounting\Models\JournalEntry;
use Modules\Accounting\Support\FiscalCalendarService;
use Modules\Accounting\Support\TrialBalanceService;
use Modules\Inventory\Models\StockLevel;
use Modules\Inventory\Models\Warehouse;
use Modules\Inventory\Models\WarehouseLocation;
use Modules\Partners\Models\Partner;
use Modules\Payables\Support\PurchaseBillService;
use Modules\Pos\Models\PosPayment;
use Modules\Pos\Models\PosShift;
use Modules\Pos\Support\PosSaleService;
use Modules\Product\Models\Product;
use Modules\Purchasing\Models\GoodReceiptNote;
use Modules\Purchasing\Models\GoodReceiptNoteItem;
use Modules\Purchasing\Models\PurchaseOrder;
use Modules\Purchasing\Models\PurchaseOrderItem;
use Modules\Purchasing\Support\GrnConfirmationService;
use Modules\Sales\Models\GoodsIssueNote;
use Modules\Sales\Models\GoodsIssueNoteItem;
use Modules\Sales\Models\SalesOrder;
use Modules\Sales\Models\SalesOrderItem;
use Modules\Sales\Support\GinConfirmationService;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class AccountingInventoryPostTest extends TestCase
{
    use RefreshDatabase;
    use WithRoles;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
        $this->setUpRoles();
        app(FiscalCalendarService::class)->ensureYear((int) now()->format('Y'));

        Setting::query()->updateOrCreate(
            ['key' => 'ecommerce.tax_enabled'],
            ['group' => 'ecommerce', 'value' => '0', 'type' => 'boolean', 'label' => 'Enable Tax']
        );
    }

    public function test_grn_confirm_posts_inventory_and_grni_then_bill_clears_grni(): void
    {
        $supplier = Partner::factory()->supplier()->create();
        $warehouse = Warehouse::factory()->create();
        $warehouse->createDefaultLocations();
        $input = WarehouseLocation::query()
            ->where('warehouse_id', $warehouse->id)
            ->where('code', 'INPUT')
            ->firstOrFail();

        $product = Product::factory()->create(['cost' => 0]);
        $po = PurchaseOrder::factory()->approved()->create([
            'partner_id' => $supplier->id,
            'warehouse_id' => $warehouse->id,
        ]);
        $poItem = PurchaseOrderItem::factory()->create([
            'purchase_order_id' => $po->id,
            'product_id' => $product->id,
            'quantity_ordered' => 10,
            'unit_price' => 1000,
        ]);

        $grn = GoodReceiptNote::factory()->create([
            'purchase_order_id' => $po->id,
            'warehouse_id' => $warehouse->id,
            'status' => GoodReceiptNote::STATUS_DRAFT,
            'freight_amount' => 500,
        ]);
        GoodReceiptNoteItem::factory()->create([
            'good_receipt_note_id' => $grn->id,
            'po_item_id' => $poItem->id,
            'location_id' => $input->id,
            'quantity_received' => 10,
        ]);

        app(GrnConfirmationService::class)->confirm($grn);

        $grnJournal = JournalEntry::query()
            ->where('source_id', $grn->id)
            ->where('event', 'grn.confirmed')
            ->with('lines.account')
            ->first();

        $this->assertNotNull($grnJournal);
        $this->assertTrue($grnJournal->isBalanced());
        $this->assertSame(10500.0, $grnJournal->totalDebit());

        $inventory = Account::query()->where('system_role', 'inventory')->firstOrFail();
        $grni = Account::query()->where('system_role', 'grni')->firstOrFail();
        $this->assertTrue($grnJournal->lines->contains(
            fn ($line) => (int) $line->account_id === (int) $inventory->id && (float) $line->debit === 10500.0
        ));
        $this->assertTrue($grnJournal->lines->contains(
            fn ($line) => (int) $line->account_id === (int) $grni->id && (float) $line->credit === 10500.0
        ));

        $user = $this->createAdminUser();
        $bill = app(PurchaseBillService::class)->createFromGrn($grn->fresh(['items.purchaseOrderItem.product', 'purchaseOrder.partner']));
        $this->actingAs($user)->post(route('module.payables.bills.issue', $bill));

        $billJournal = JournalEntry::query()
            ->where('source_id', $bill->id)
            ->where('event', 'supplier_bill.issued')
            ->with('lines.account')
            ->first();

        $this->assertNotNull($billJournal);
        // Bill merchandise only (no freight): Dr GRNI 10000 Cr AP 10000
        $this->assertTrue($billJournal->lines->contains(
            fn ($line) => $line->account->system_role === 'grni' && (float) $line->debit === 10000.0
        ));
    }

    public function test_grn_void_reverses_inventory_journal(): void
    {
        $user = $this->createAdminUser();
        $supplier = Partner::factory()->supplier()->create();
        $warehouse = Warehouse::factory()->create();
        $warehouse->createDefaultLocations();
        $input = WarehouseLocation::query()
            ->where('warehouse_id', $warehouse->id)
            ->where('code', 'INPUT')
            ->firstOrFail();

        $product = Product::factory()->create(['cost' => 0]);
        $po = PurchaseOrder::factory()->approved()->create([
            'partner_id' => $supplier->id,
            'warehouse_id' => $warehouse->id,
        ]);
        $poItem = PurchaseOrderItem::factory()->create([
            'purchase_order_id' => $po->id,
            'product_id' => $product->id,
            'quantity_ordered' => 5,
            'unit_price' => 2000,
        ]);
        $grn = GoodReceiptNote::factory()->create([
            'purchase_order_id' => $po->id,
            'warehouse_id' => $warehouse->id,
            'status' => GoodReceiptNote::STATUS_DRAFT,
            'freight_amount' => 0,
        ]);
        GoodReceiptNoteItem::factory()->create([
            'good_receipt_note_id' => $grn->id,
            'po_item_id' => $poItem->id,
            'location_id' => $input->id,
            'quantity_received' => 5,
        ]);

        app(GrnConfirmationService::class)->confirm($grn);
        $this->actingAs($user);
        app(GrnConfirmationService::class)->void($grn->fresh());

        $this->assertSame(
            JournalEntry::STATUS_VOID,
            JournalEntry::query()->where('event', 'grn.confirmed')->where('source_id', $grn->id)->value('status')
        );
        $this->assertTrue(
            JournalEntry::query()
                ->where('event', 'grn.voided')
                ->where('source_id', $grn->id)
                ->where('status', JournalEntry::STATUS_POSTED)
                ->exists()
        );
    }

    public function test_gin_confirm_posts_cogs_from_moving_average(): void
    {
        $customer = Partner::factory()->create(['customer_rank' => 1]);
        $warehouse = Warehouse::factory()->create();
        $warehouse->createDefaultLocations();
        $stock = WarehouseLocation::query()
            ->where('warehouse_id', $warehouse->id)
            ->where('code', 'STOCK')
            ->firstOrFail();

        $product = Product::factory()->create(['cost' => 1500]);
        StockLevel::factory()->create([
            'product_id' => $product->id,
            'warehouse_id' => $warehouse->id,
            'location_id' => $stock->id,
            'on_hand' => 100,
            'reserved' => 0,
        ]);

        $so = SalesOrder::factory()->confirmed()->create([
            'partner_id' => $customer->id,
            'warehouse_id' => $warehouse->id,
        ]);
        $soItem = SalesOrderItem::factory()->create([
            'sales_order_id' => $so->id,
            'product_id' => $product->id,
            'quantity_ordered' => 4,
            'quantity_delivered' => 0,
            'unit_price' => 3000,
        ]);

        $gin = GoodsIssueNote::factory()->create([
            'sales_order_id' => $so->id,
            'warehouse_id' => $warehouse->id,
            'status' => GoodsIssueNote::STATUS_DRAFT,
        ]);
        GoodsIssueNoteItem::factory()->create([
            'goods_issue_note_id' => $gin->id,
            'so_item_id' => $soItem->id,
            'location_id' => $stock->id,
            'quantity_issued' => 4,
        ]);

        $this->actingAs($this->createAdminUser());
        app(GinConfirmationService::class)->confirm($gin);

        $journal = JournalEntry::query()
            ->where('source_id', $gin->id)
            ->where('event', 'gin.confirmed')
            ->with('lines.account')
            ->first();

        $this->assertNotNull($journal);
        $this->assertSame(6000.0, $journal->totalDebit());
        $this->assertTrue($journal->lines->contains(
            fn ($line) => $line->account->system_role === 'cogs' && (float) $line->debit === 6000.0
        ));
        $this->assertTrue($journal->lines->contains(
            fn ($line) => $line->account->system_role === 'inventory' && (float) $line->credit === 6000.0
        ));
    }

    public function test_pos_sale_posts_revenue_cash_and_cogs(): void
    {
        $store = Warehouse::factory()->asStore()->create(['status' => 'active']);
        $store->createDefaultLocations();
        $location = $store->locations()->where('code', 'STOCK')->firstOrFail();

        $product = Product::factory()->create([
            'category' => 'merchandise',
            'status' => 'active',
            'price' => 11000,
            'cost' => 4000,
        ]);
        StockLevel::factory()->create([
            'product_id' => $product->id,
            'warehouse_id' => $store->id,
            'location_id' => $location->id,
            'on_hand' => 20,
            'reserved' => 0,
        ]);

        $user = $this->createAdminUser();
        $shift = PosShift::query()->create([
            'warehouse_id' => $store->id,
            'opened_by' => $user->id,
            'status' => PosShift::STATUS_OPEN,
            'opening_float' => 50000,
            'opened_at' => now(),
        ]);

        $sale = app(PosSaleService::class)->complete($shift, $user, [
            'items' => [
                ['product_id' => $product->id, 'quantity' => 2, 'unit_price' => 11000],
            ],
            'payment_method' => PosPayment::METHOD_CASH,
            'amount_tendered' => 25000,
        ]);

        $journal = JournalEntry::query()
            ->where('source_id', $sale->id)
            ->where('event', 'pos_sale.completed')
            ->with('lines.account')
            ->first();

        $this->assertNotNull($journal);
        $this->assertTrue($journal->isBalanced());

        $cash = $journal->lines->first(fn ($line) => $line->account->system_role === 'cash');
        $revenue = $journal->lines->first(fn ($line) => $line->account->system_role === 'pos_revenue');
        $cogs = $journal->lines->first(fn ($line) => $line->account->system_role === 'cogs');

        $this->assertSame(22000.0, (float) $cash->debit);
        $this->assertSame(22000.0, (float) $revenue->credit);
        $this->assertSame(8000.0, (float) $cogs->debit);

        $tb = app(TrialBalanceService::class)->forPeriod($journal->fiscalPeriod);
        $this->assertTrue($tb['is_balanced']);
    }
}
