<?php

namespace Tests\Feature\Modules\TradePromotions;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Inventory\Models\Warehouse;
use Modules\Orders\Models\DeliveryOrder;
use Modules\Orders\Models\DeliveryOrderItem;
use Modules\Partners\Models\Partner;
use Modules\Pos\Models\PosSale;
use Modules\Pos\Models\PosSaleItem;
use Modules\Pos\Models\PosShift;
use Modules\Product\Models\Product;
use Modules\Sales\Models\SalesOrder;
use Modules\Sales\Models\SalesOrderItem;
use Modules\TradePromotions\Models\TradePromoAward;
use Modules\TradePromotions\Models\TradePromoProgram;
use Modules\TradePromotions\Models\TradePromoRealization;
use Modules\TradePromotions\Support\PromoRealizationService;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class TradePromotionTest extends TestCase
{
    use RefreshDatabase;
    use WithRoles;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
        $this->setUpRoles();
    }

    public function test_volume_discount_program_can_be_created_via_http(): void
    {
        $user = $this->createAdminUser();
        $partner = Partner::factory()->create(['customer_rank' => 1]);
        $product = Product::factory()->create(['price' => 10000]);

        $response = $this->actingAs($user)->post(route('module.promotions.programs.store'), [
            'name' => 'Diskon Volume Q3',
            'mode' => TradePromoProgram::MODE_TRADE,
            'scope' => TradePromoProgram::SCOPE_GLOBAL,
            'type' => TradePromoProgram::TYPE_VOLUME_DISCOUNT,
            'starts_at' => now()->subDay()->toDateTimeString(),
            'ends_at' => now()->addMonth()->toDateTimeString(),
            'target_metric' => TradePromoProgram::METRIC_VOLUME,
            'target_amount' => 500,
            'partner_ids' => [$partner->id],
            'product_ids' => [$product->id],
            'tiers' => [
                ['min_qty' => 100, 'discount_percent' => 5],
                ['min_qty' => 300, 'discount_percent' => 10],
            ],
        ]);

        $program = TradePromoProgram::query()->first();
        $this->assertNotNull($program);
        $response->assertRedirect(route('module.promotions.programs.show', $program));
        $this->assertSame(2, $program->tiers()->count());
        $this->assertTrue($program->partners()->whereKey($partner->id)->exists());
    }

    public function test_sync_realizes_volume_from_delivery_orders_and_accrues_discount(): void
    {
        $partner = Partner::factory()->create(['customer_rank' => 1]);
        $product = Product::factory()->create(['price' => 10000]);

        $program = TradePromoProgram::query()->create([
            'code' => 'TP-TEST-1',
            'name' => 'Volume Promo',
            'type' => TradePromoProgram::TYPE_VOLUME_DISCOUNT,
            'status' => TradePromoProgram::STATUS_ACTIVE,
            'starts_at' => now()->subWeek(),
            'ends_at' => now()->addWeek(),
            'target_metric' => TradePromoProgram::METRIC_VOLUME,
            'target_amount' => 200,
        ]);
        $program->partners()->attach($partner->id);
        $program->products()->attach($product->id);
        $program->tiers()->create([
            'sort_order' => 1,
            'min_qty' => 100,
            'discount_percent' => 5,
        ]);

        $order = DeliveryOrder::factory()->confirmed()->create([
            'partner_id' => $partner->id,
            'order_date' => now()->toDateString(),
        ]);
        DeliveryOrderItem::factory()->create([
            'delivery_order_id' => $order->id,
            'product_id' => $product->id,
            'quantity' => 150,
        ]);

        app(PromoRealizationService::class)->syncProgram($program->fresh());

        $realization = TradePromoRealization::query()
            ->where('trade_promo_program_id', $program->id)
            ->where('partner_id', $partner->id)
            ->first();

        $this->assertNotNull($realization);
        $this->assertEquals(150, (float) $realization->realized_qty);
        $this->assertEquals(1500000, (float) $realization->realized_value);
        $this->assertEquals(75, (float) $realization->achievement_percent);

        $award = TradePromoAward::query()->where('trade_promo_realization_id', $realization->id)->first();
        $this->assertNotNull($award);
        $this->assertSame(TradePromoAward::TYPE_DISCOUNT, $award->award_type);
        $this->assertEquals(75000, (float) $award->amount);
    }

    public function test_rebate_program_accrues_per_unit_rebate(): void
    {
        $partner = Partner::factory()->create(['customer_rank' => 1]);
        $product = Product::factory()->create(['price' => 5000]);

        $program = TradePromoProgram::query()->create([
            'code' => 'TP-REBATE',
            'name' => 'Rabat Unit',
            'type' => TradePromoProgram::TYPE_REBATE,
            'status' => TradePromoProgram::STATUS_ACTIVE,
            'starts_at' => now()->subDay(),
            'ends_at' => now()->addMonth(),
            'target_metric' => TradePromoProgram::METRIC_VOLUME,
            'target_amount' => 50,
        ]);
        $program->partners()->attach($partner->id);
        $program->products()->attach($product->id);
        $program->rebateRule()->create([
            'rebate_per_unit' => 500,
            'calc_basis' => 'qty',
        ]);

        $order = DeliveryOrder::factory()->confirmed()->create([
            'partner_id' => $partner->id,
            'order_date' => now()->toDateString(),
            'status' => DeliveryOrder::STATUS_DELIVERED,
            'delivered_at' => now(),
        ]);
        DeliveryOrderItem::factory()->create([
            'delivery_order_id' => $order->id,
            'product_id' => $product->id,
            'quantity' => 80,
        ]);

        app(PromoRealizationService::class)->syncProgram($program->fresh());

        $award = TradePromoAward::query()->where('partner_id', $partner->id)->first();
        $this->assertNotNull($award);
        $this->assertSame(TradePromoAward::TYPE_REBATE, $award->award_type);
        $this->assertEquals(40000, (float) $award->amount);
    }

    public function test_sync_merges_sales_order_delivered_qty_into_realization(): void
    {
        $partner = Partner::factory()->create(['customer_rank' => 1]);
        $warehouse = Warehouse::factory()->create(['status' => 'active']);
        $product = Product::factory()->create(['price' => 10000]);

        $program = TradePromoProgram::query()->create([
            'code' => 'TP-SO-ACC',
            'name' => 'SO Accrual',
            'type' => TradePromoProgram::TYPE_VOLUME_DISCOUNT,
            'mode' => TradePromoProgram::MODE_TRADE,
            'scope' => TradePromoProgram::SCOPE_GLOBAL,
            'status' => TradePromoProgram::STATUS_ACTIVE,
            'starts_at' => now()->subWeek(),
            'ends_at' => now()->addWeek(),
            'target_metric' => TradePromoProgram::METRIC_VOLUME,
            'target_amount' => 200,
        ]);
        $program->partners()->attach($partner->id);
        $program->products()->attach($product->id);
        $program->tiers()->create([
            'sort_order' => 1,
            'min_qty' => 50,
            'discount_percent' => 5,
        ]);

        $so = SalesOrder::factory()->fullyDelivered()->create([
            'partner_id' => $partner->id,
            'warehouse_id' => $warehouse->id,
            'ordered_at' => now()->toDateString(),
        ]);
        SalesOrderItem::factory()->create([
            'sales_order_id' => $so->id,
            'product_id' => $product->id,
            'quantity_ordered' => 100,
            'quantity_delivered' => 80,
            'unit_price' => 10000,
            'line_discount' => 8000,
        ]);

        app(PromoRealizationService::class)->syncProgram($program->fresh(['partners', 'products', 'tiers']));

        $realization = TradePromoRealization::query()
            ->where('trade_promo_program_id', $program->id)
            ->where('partner_id', $partner->id)
            ->first();

        $this->assertNotNull($realization);
        $this->assertEquals(80, (float) $realization->realized_qty);
        // Net value: 80 * 10000 - (8000 * 80/100) = 800000 - 6400 = 793600
        $this->assertEquals(793600, (float) $realization->realized_value);
        $this->assertEquals(40, (float) $realization->achievement_percent);
    }

    public function test_sync_merges_pos_sales_with_partner_into_realization(): void
    {
        $partner = Partner::factory()->create(['customer_rank' => 1]);
        $store = Warehouse::factory()->asStore()->create(['status' => 'active']);
        $product = Product::factory()->create(['price' => 5000]);

        $program = TradePromoProgram::query()->create([
            'code' => 'TP-POS-ACC',
            'name' => 'POS Accrual',
            'type' => TradePromoProgram::TYPE_REBATE,
            'mode' => TradePromoProgram::MODE_TRADE,
            'scope' => TradePromoProgram::SCOPE_GLOBAL,
            'status' => TradePromoProgram::STATUS_ACTIVE,
            'starts_at' => now()->subDay(),
            'ends_at' => now()->addMonth(),
            'target_metric' => TradePromoProgram::METRIC_VOLUME,
            'target_amount' => 50,
        ]);
        $program->partners()->attach($partner->id);
        $program->products()->attach($product->id);
        $program->rebateRule()->create([
            'rebate_per_unit' => 100,
            'calc_basis' => 'qty',
        ]);

        $user = $this->createAdminUser();
        $shift = PosShift::query()->create([
            'warehouse_id' => $store->id,
            'opened_by' => $user->id,
            'status' => PosShift::STATUS_OPEN,
            'opening_float' => 0,
            'opened_at' => now(),
        ]);

        $sale = PosSale::query()->create([
            'code' => 'POS-ACC-1',
            'pos_shift_id' => $shift->id,
            'warehouse_id' => $store->id,
            'cashier_id' => $user->id,
            'partner_id' => $partner->id,
            'status' => PosSale::STATUS_COMPLETED,
            'subtotal' => 45000,
            'discount_total' => 0,
            'tax_total' => 0,
            'grand_total' => 45000,
            'sold_at' => now(),
        ]);
        PosSaleItem::query()->create([
            'pos_sale_id' => $sale->id,
            'product_id' => $product->id,
            'quantity' => 9,
            'qty_base' => 9,
            'unit_price' => 5000,
            'line_discount' => 0,
            'tax_amount' => 0,
            'line_total' => 45000,
            'unit' => 'pcs',
        ]);

        app(PromoRealizationService::class)->syncProgram($program->fresh(['partners', 'products', 'rebateRule']));

        $realization = TradePromoRealization::query()
            ->where('trade_promo_program_id', $program->id)
            ->where('partner_id', $partner->id)
            ->first();

        $this->assertNotNull($realization);
        $this->assertEquals(9, (float) $realization->realized_qty);
        $this->assertEquals(45000, (float) $realization->realized_value);

        $award = TradePromoAward::query()->where('trade_promo_realization_id', $realization->id)->first();
        $this->assertNotNull($award);
        $this->assertEquals(900, (float) $award->amount);
    }

    public function test_sync_combines_delivery_order_and_sales_order_qty(): void
    {
        $partner = Partner::factory()->create(['customer_rank' => 1]);
        $warehouse = Warehouse::factory()->create(['status' => 'active']);
        $product = Product::factory()->create(['price' => 10000]);

        $program = TradePromoProgram::query()->create([
            'code' => 'TP-MIX',
            'name' => 'Mixed Channels',
            'type' => TradePromoProgram::TYPE_VOLUME_DISCOUNT,
            'mode' => TradePromoProgram::MODE_TRADE,
            'scope' => TradePromoProgram::SCOPE_GLOBAL,
            'status' => TradePromoProgram::STATUS_ACTIVE,
            'starts_at' => now()->subWeek(),
            'ends_at' => now()->addWeek(),
            'target_metric' => TradePromoProgram::METRIC_VOLUME,
            'target_amount' => 200,
        ]);
        $program->partners()->attach($partner->id);
        $program->products()->attach($product->id);
        $program->tiers()->create(['sort_order' => 1, 'min_qty' => 100, 'discount_percent' => 5]);

        $order = DeliveryOrder::factory()->confirmed()->create([
            'partner_id' => $partner->id,
            'order_date' => now()->toDateString(),
        ]);
        DeliveryOrderItem::factory()->create([
            'delivery_order_id' => $order->id,
            'product_id' => $product->id,
            'quantity' => 60,
        ]);

        $so = SalesOrder::factory()->partialDelivered()->create([
            'partner_id' => $partner->id,
            'warehouse_id' => $warehouse->id,
            'ordered_at' => now()->toDateString(),
        ]);
        SalesOrderItem::factory()->create([
            'sales_order_id' => $so->id,
            'product_id' => $product->id,
            'quantity_ordered' => 100,
            'quantity_delivered' => 40,
            'unit_price' => 10000,
            'line_discount' => 0,
        ]);

        app(PromoRealizationService::class)->syncProgram($program->fresh(['partners', 'products', 'tiers']));

        $realization = TradePromoRealization::query()
            ->where('trade_promo_program_id', $program->id)
            ->where('partner_id', $partner->id)
            ->first();

        $this->assertNotNull($realization);
        $this->assertEquals(100, (float) $realization->realized_qty);
    }

    public function test_award_can_be_settled(): void
    {
        $user = $this->createAdminUser();
        $partner = Partner::factory()->create(['customer_rank' => 1]);
        $program = TradePromoProgram::query()->create([
            'code' => 'TP-SETTLE',
            'name' => 'Settle Me',
            'type' => TradePromoProgram::TYPE_REBATE,
            'status' => TradePromoProgram::STATUS_ACTIVE,
            'starts_at' => now()->subDay(),
            'ends_at' => now()->addDay(),
            'target_metric' => TradePromoProgram::METRIC_VOLUME,
        ]);
        $award = TradePromoAward::query()->create([
            'trade_promo_program_id' => $program->id,
            'partner_id' => $partner->id,
            'award_type' => TradePromoAward::TYPE_REBATE,
            'amount' => 10000,
            'status' => TradePromoAward::STATUS_ACCRUED,
        ]);

        $this->actingAs($user)
            ->post(route('module.promotions.awards.settle', $award))
            ->assertSessionHas('success');

        $award->refresh();
        $this->assertSame(TradePromoAward::STATUS_SETTLED, $award->status);
        $this->assertSame(\Modules\TradePromotions\Support\PromoAwardSettlementService::SETTLEMENT_CREDIT_NOTE, $award->settlement_type);
        $this->assertNotNull($award->settlement_id);

        $invoice = \Modules\Invoicing\Models\Invoice::query()->find($award->settlement_id);
        $this->assertNotNull($invoice);
        $this->assertTrue($invoice->isCreditNote());
        $this->assertSame(\Modules\Invoicing\Models\Invoice::STATUS_ISSUED, $invoice->status);
        $this->assertEquals(-10000, (float) $invoice->subtotal);
    }

    public function test_free_goods_award_settles_to_draft_sales_order(): void
    {
        $user = $this->createAdminUser();
        $partner = Partner::factory()->create(['customer_rank' => 1]);
        Warehouse::factory()->create(['status' => 'active']);
        $product = Product::factory()->create(['status' => 'active', 'unit' => 'pcs']);

        $program = TradePromoProgram::query()->create([
            'code' => 'TP-FG-SET',
            'name' => 'Free Goods Settle',
            'type' => TradePromoProgram::TYPE_FREE_GOODS,
            'status' => TradePromoProgram::STATUS_ACTIVE,
            'starts_at' => now()->subDay(),
            'ends_at' => now()->addDay(),
            'target_metric' => TradePromoProgram::METRIC_VOLUME,
        ]);
        $award = TradePromoAward::query()->create([
            'trade_promo_program_id' => $program->id,
            'partner_id' => $partner->id,
            'award_type' => TradePromoAward::TYPE_FREE_GOODS,
            'free_product_id' => $product->id,
            'free_qty' => 3,
            'status' => TradePromoAward::STATUS_ACCRUED,
        ]);

        $this->actingAs($user)
            ->post(route('module.promotions.awards.settle', $award))
            ->assertSessionHas('success');

        $award->refresh();
        $this->assertSame(TradePromoAward::STATUS_SETTLED, $award->status);
        $this->assertSame(\Modules\TradePromotions\Support\PromoAwardSettlementService::SETTLEMENT_SALES_ORDER, $award->settlement_type);

        $so = SalesOrder::query()->find($award->settlement_id);
        $this->assertNotNull($so);
        $this->assertSame(SalesOrder::STATUS_DRAFT, $so->status);
        $this->assertEquals(3, (float) $so->items()->first()->quantity_ordered);
        $this->assertEquals(0, (float) $so->items()->first()->unit_price);
    }

    public function test_reports_page_summarizes_checkout_by_channel(): void
    {
        $user = $this->createAdminUser();
        $program = TradePromoProgram::query()->create([
            'code' => 'TP-REP',
            'name' => 'Report Promo',
            'type' => TradePromoProgram::TYPE_CHECKOUT_DISCOUNT,
            'mode' => TradePromoProgram::MODE_CHECKOUT,
            'scope' => TradePromoProgram::SCOPE_GLOBAL,
            'channels' => ['pos'],
            'status' => TradePromoProgram::STATUS_ACTIVE,
            'starts_at' => now()->subDay(),
            'ends_at' => now()->addDay(),
            'target_metric' => TradePromoProgram::METRIC_VOLUME,
        ]);

        \Modules\TradePromotions\Models\PromoApplication::query()->create([
            'trade_promo_program_id' => $program->id,
            'source_type' => 'pos_sale',
            'source_id' => 1,
            'product_id' => Product::factory()->create()->id,
            'discount_amount' => 1500,
            'meta' => ['kind' => 'percent'],
        ]);

        $this->actingAs($user)
            ->get(route('module.promotions.reports.index', [], false))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/TradePromotions/Reports/Index')
                ->where('summary.checkout_by_channel.0.channel', 'pos')
                ->where('summary.checkout_by_channel.0.discount_total', 1500));
    }
}
