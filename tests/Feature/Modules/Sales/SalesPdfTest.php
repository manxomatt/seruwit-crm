<?php

namespace Tests\Feature\Modules\Sales;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Inventory\Models\Warehouse;
use Modules\Partners\Models\Partner;
use Modules\Product\Models\Product;
use Modules\Sales\Models\GoodsIssueNote;
use Modules\Sales\Models\GoodsIssueNoteItem;
use Modules\Sales\Models\SalesOrder;
use Modules\Sales\Models\SalesOrderItem;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class SalesPdfTest extends TestCase
{
    use RefreshDatabase, WithRoles;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
        $this->setUpRoles();
    }

    public function test_confirmed_so_streams_pdf(): void
    {
        $user = $this->createAdminUser();
        $so = SalesOrder::factory()->confirmed()->create([
            'partner_id' => Partner::factory()->create(['customer_rank' => 1])->id,
            'warehouse_id' => Warehouse::factory()->create()->id,
        ]);
        SalesOrderItem::factory()->create([
            'sales_order_id' => $so->id,
            'product_id' => Product::factory()->create()->id,
        ]);

        $this->actingAs($user)
            ->get(route('module.sales.sales-orders.pdf', $so, false))
            ->assertOk()
            ->assertHeader('Content-Type', 'application/pdf');
    }

    public function test_confirmed_gin_streams_pdf(): void
    {
        $user = $this->createAdminUser();
        $so = SalesOrder::factory()->confirmed()->create();
        $item = SalesOrderItem::factory()->create(['sales_order_id' => $so->id]);
        $gin = GoodsIssueNote::factory()->create([
            'sales_order_id' => $so->id,
            'warehouse_id' => $so->warehouse_id,
            'status' => GoodsIssueNote::STATUS_CONFIRMED,
        ]);
        GoodsIssueNoteItem::factory()->create([
            'goods_issue_note_id' => $gin->id,
            'so_item_id' => $item->id,
            'quantity_issued' => 3,
        ]);

        $this->actingAs($user)
            ->get(route('module.sales.gin.pdf', $gin, false))
            ->assertOk()
            ->assertHeader('Content-Type', 'application/pdf');
    }
}
