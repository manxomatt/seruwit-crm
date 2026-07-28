<?php

namespace Tests\Feature\Modules\TradePromotions;

use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Inventory\Models\StockLevel;
use Modules\Inventory\Models\Warehouse;
use Modules\Inventory\Support\AccessibleWarehouses;
use Modules\Pos\Models\PosPayment;
use Modules\Pos\Models\PosSale;
use Modules\Pos\Models\PosShift;
use Modules\Product\Models\Product;
use Modules\TradePromotions\Models\PromoApplication;
use Modules\TradePromotions\Models\TradePromoProgram;
use Modules\TradePromotions\Support\PromotionPricing;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class PromotionPricingTest extends TestCase
{
    use RefreshDatabase, WithRoles;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
        $this->setUpRoles();
    }

    /**
     * @param  list<int>  $warehouseIds
     */
    protected function createScopedUser(string $roleSlug, array $warehouseIds): User
    {
        $user = User::factory()->create();
        $role = Role::query()->where('slug', $roleSlug)->firstOrFail();
        $user->assignRole($role);
        $user->warehouses()->sync($warehouseIds);

        return $user;
    }

    public function test_global_checkout_promo_overrides_site_promo(): void
    {
        $store = Warehouse::factory()->asStore()->create(['status' => 'active']);
        $product = Product::factory()->create(['price' => 10000, 'status' => 'active']);

        $global = TradePromoProgram::query()->create([
            'code' => 'TP-G',
            'name' => 'Global 10%',
            'type' => TradePromoProgram::TYPE_CHECKOUT_DISCOUNT,
            'mode' => TradePromoProgram::MODE_CHECKOUT,
            'scope' => TradePromoProgram::SCOPE_GLOBAL,
            'channels' => [TradePromoProgram::CHANNEL_POS],
            'status' => TradePromoProgram::STATUS_ACTIVE,
            'starts_at' => now()->subDay(),
            'ends_at' => now()->addMonth(),
            'target_metric' => TradePromoProgram::METRIC_VOLUME,
        ]);
        $global->products()->attach($product->id);
        $global->tiers()->create(['sort_order' => 1, 'min_qty' => 1, 'discount_percent' => 10]);

        $local = TradePromoProgram::query()->create([
            'code' => 'TP-L',
            'name' => 'Local 15%',
            'type' => TradePromoProgram::TYPE_CHECKOUT_DISCOUNT,
            'mode' => TradePromoProgram::MODE_CHECKOUT,
            'scope' => TradePromoProgram::SCOPE_SITES,
            'channels' => [TradePromoProgram::CHANNEL_POS],
            'status' => TradePromoProgram::STATUS_ACTIVE,
            'starts_at' => now()->subDay(),
            'ends_at' => now()->addMonth(),
            'target_metric' => TradePromoProgram::METRIC_VOLUME,
        ]);
        $local->products()->attach($product->id);
        $local->warehouses()->attach($store->id);
        $local->tiers()->create(['sort_order' => 1, 'min_qty' => 1, 'discount_percent' => 15]);

        $quote = app(PromotionPricing::class)->quote([
            'channel' => 'pos',
            'warehouse_id' => $store->id,
            'lines' => [[
                'product_id' => $product->id,
                'quantity' => 2,
                'unit_price' => 10000,
            ]],
        ]);

        $this->assertEquals(2000.0, $quote['discount_total']);
        $this->assertSame($global->id, $quote['lines'][0]['program_id']);
        $this->assertEquals(18000.0, $quote['lines'][0]['line_total']);
    }

    public function test_non_admin_cannot_set_global_scope(): void
    {
        $store = Warehouse::factory()->asStore()->create(['status' => 'active']);
        $head = $this->createScopedUser(AccessibleWarehouses::ROLE_HEAD, [$store->id]);

        $validator = validator([], []);
        \Modules\TradePromotions\Support\PromoProgramAuthorizer::assertCanSetScope(
            $validator,
            $head,
            TradePromoProgram::SCOPE_GLOBAL,
        );

        $this->assertTrue($validator->errors()->has('scope'));
    }

    public function test_pos_sale_applies_checkout_discount_and_records_application(): void
    {
        $user = $this->createAdminUser();
        $store = Warehouse::factory()->asStore()->create(['status' => 'active']);
        $store->createDefaultLocations();
        $location = $store->locations()->where('code', 'STOCK')->first();
        $product = Product::factory()->create([
            'category' => 'merchandise',
            'status' => 'active',
            'price' => 10000,
        ]);
        StockLevel::factory()->create([
            'product_id' => $product->id,
            'warehouse_id' => $store->id,
            'location_id' => $location->id,
            'on_hand' => 20,
            'reserved' => 0,
            'batch_number' => 'LOT-P',
            'expiry_date' => now()->addYear()->toDateString(),
        ]);

        $program = TradePromoProgram::query()->create([
            'code' => 'TP-POS',
            'name' => 'POS 10%',
            'type' => TradePromoProgram::TYPE_CHECKOUT_DISCOUNT,
            'mode' => TradePromoProgram::MODE_CHECKOUT,
            'scope' => TradePromoProgram::SCOPE_GLOBAL,
            'channels' => [TradePromoProgram::CHANNEL_POS],
            'status' => TradePromoProgram::STATUS_ACTIVE,
            'starts_at' => now()->subDay(),
            'ends_at' => now()->addMonth(),
            'target_metric' => TradePromoProgram::METRIC_VOLUME,
        ]);
        $program->products()->attach($product->id);
        $program->tiers()->create(['sort_order' => 1, 'min_qty' => 1, 'discount_percent' => 10]);

        $shift = PosShift::query()->create([
            'warehouse_id' => $store->id,
            'opened_by' => $user->id,
            'status' => PosShift::STATUS_OPEN,
            'opening_float' => 0,
            'opened_at' => now(),
        ]);

        $this->actingAs($user)->post(route('module.pos.sales.store', [], false), [
            'pos_shift_id' => $shift->id,
            'items' => [['product_id' => $product->id, 'quantity' => 1, 'unit_price' => 10000]],
            'payment_method' => PosPayment::METHOD_CASH,
            'amount_tendered' => 9000,
        ])->assertRedirect();

        $sale = PosSale::query()->first();
        $this->assertNotNull($sale);
        $this->assertEquals(9000.0, (float) $sale->grand_total);
        $this->assertEquals(1000.0, (float) $sale->discount_total);
        $this->assertEquals(1000.0, (float) $sale->items()->first()->line_discount);
        $this->assertDatabaseHas('promo_applications', [
            'trade_promo_program_id' => $program->id,
            'source_type' => 'pos_sale',
            'source_id' => $sale->id,
            'product_id' => $product->id,
        ]);
        $this->assertSame(1, PromoApplication::query()->count());
    }

    public function test_sales_order_applies_checkout_discount_and_records_application(): void
    {
        $user = $this->createAdminUser();
        $customer = \Modules\Partners\Models\Partner::factory()->create([
            'customer_rank' => 1,
            'supplier_rank' => 0,
        ]);
        $warehouse = Warehouse::factory()->create(['status' => 'active']);
        $product = Product::factory()->create([
            'status' => 'active',
            'price' => 10000,
            'unit' => 'pcs',
        ]);

        $program = TradePromoProgram::query()->create([
            'code' => 'TP-SO',
            'name' => 'SO 10%',
            'type' => TradePromoProgram::TYPE_CHECKOUT_DISCOUNT,
            'mode' => TradePromoProgram::MODE_CHECKOUT,
            'scope' => TradePromoProgram::SCOPE_GLOBAL,
            'channels' => [TradePromoProgram::CHANNEL_SALES],
            'status' => TradePromoProgram::STATUS_ACTIVE,
            'starts_at' => now()->subDay(),
            'ends_at' => now()->addMonth(),
            'target_metric' => TradePromoProgram::METRIC_VOLUME,
        ]);
        $program->products()->attach($product->id);
        $program->tiers()->create(['sort_order' => 1, 'min_qty' => 1, 'discount_percent' => 10]);

        $this->actingAs($user)->post(route('module.sales.sales-orders.store', [], false), [
            'partner_id' => $customer->id,
            'warehouse_id' => $warehouse->id,
            'ordered_at' => now()->toDateString(),
            'items' => [[
                'product_id' => $product->id,
                'quantity_ordered' => 2,
                'unit_price' => 10000,
                'unit' => 'pcs',
            ]],
        ])->assertRedirect();

        $so = \Modules\Sales\Models\SalesOrder::query()->first();
        $this->assertNotNull($so);
        $this->assertEquals(18000.0, (float) $so->total_amount);
        $this->assertEquals(2000.0, (float) $so->discount_total);
        $this->assertEquals(2000.0, (float) $so->items()->first()->line_discount);
        $this->assertDatabaseHas('promo_applications', [
            'trade_promo_program_id' => $program->id,
            'source_type' => 'sales_order',
            'source_id' => $so->id,
            'product_id' => $product->id,
        ]);
        $this->assertSame(1, PromoApplication::query()->count());
    }

    public function test_checkout_bogo_applies_free_units_as_line_discount(): void
    {
        $store = Warehouse::factory()->asStore()->create(['status' => 'active']);
        $product = Product::factory()->create(['price' => 10000, 'status' => 'active']);

        $program = TradePromoProgram::query()->create([
            'code' => 'TP-BOGO',
            'name' => 'Buy 2 Get 1',
            'type' => TradePromoProgram::TYPE_CHECKOUT_BOGO,
            'mode' => TradePromoProgram::MODE_CHECKOUT,
            'scope' => TradePromoProgram::SCOPE_GLOBAL,
            'channels' => [TradePromoProgram::CHANNEL_POS, TradePromoProgram::CHANNEL_SALES],
            'status' => TradePromoProgram::STATUS_ACTIVE,
            'starts_at' => now()->subDay(),
            'ends_at' => now()->addMonth(),
            'target_metric' => TradePromoProgram::METRIC_VOLUME,
        ]);
        $program->products()->attach($product->id);
        $program->tiers()->create([
            'sort_order' => 1,
            'min_qty' => 2,
            'free_qty' => 1,
        ]);

        $quote = app(PromotionPricing::class)->quote([
            'channel' => 'pos',
            'warehouse_id' => $store->id,
            'lines' => [[
                'product_id' => $product->id,
                'quantity' => 4,
                'unit_price' => 10000,
            ]],
        ]);

        // floor(4/2)*1 = 2 free units → 20000 discount
        $this->assertEquals(20000.0, $quote['discount_total']);
        $this->assertEquals(20000.0, $quote['lines'][0]['line_total']);
        $this->assertSame('bogo', $quote['lines'][0]['meta']['kind']);
    }

    public function test_checkout_bundle_requires_all_products_in_cart(): void
    {
        $store = Warehouse::factory()->asStore()->create(['status' => 'active']);
        $productA = Product::factory()->create(['price' => 10000, 'status' => 'active']);
        $productB = Product::factory()->create(['price' => 5000, 'status' => 'active']);

        $program = TradePromoProgram::query()->create([
            'code' => 'TP-BUNDLE',
            'name' => 'Bundle 10%',
            'type' => TradePromoProgram::TYPE_CHECKOUT_BUNDLE,
            'mode' => TradePromoProgram::MODE_CHECKOUT,
            'scope' => TradePromoProgram::SCOPE_GLOBAL,
            'channels' => [TradePromoProgram::CHANNEL_SALES],
            'status' => TradePromoProgram::STATUS_ACTIVE,
            'starts_at' => now()->subDay(),
            'ends_at' => now()->addMonth(),
            'target_metric' => TradePromoProgram::METRIC_VOLUME,
        ]);
        $program->products()->attach([$productA->id, $productB->id]);
        $program->tiers()->create([
            'sort_order' => 1,
            'min_qty' => 1,
            'discount_percent' => 10,
        ]);

        $incomplete = app(PromotionPricing::class)->quote([
            'channel' => 'sales',
            'warehouse_id' => $store->id,
            'lines' => [[
                'product_id' => $productA->id,
                'quantity' => 1,
                'unit_price' => 10000,
            ]],
        ]);
        $this->assertEquals(0.0, $incomplete['discount_total']);

        $complete = app(PromotionPricing::class)->quote([
            'channel' => 'sales',
            'warehouse_id' => $store->id,
            'lines' => [
                ['product_id' => $productA->id, 'quantity' => 1, 'unit_price' => 10000],
                ['product_id' => $productB->id, 'quantity' => 2, 'unit_price' => 5000],
            ],
        ]);

        $this->assertEquals(2000.0, $complete['discount_total']); // 10% of 10000 + 10% of 10000
    }
}
