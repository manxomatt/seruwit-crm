<?php

namespace Tests\Feature\Modules\TradePromotions;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Orders\Models\DeliveryOrder;
use Modules\Orders\Models\DeliveryOrderItem;
use Modules\Partners\Models\Partner;
use Modules\Product\Models\Product;
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

        $this->assertSame(TradePromoAward::STATUS_SETTLED, $award->fresh()->status);
    }
}
