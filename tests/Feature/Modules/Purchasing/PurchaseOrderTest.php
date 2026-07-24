<?php

namespace Tests\Feature\Modules\Purchasing;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Inventory\Models\Warehouse;
use Modules\Partners\Models\Partner;
use Modules\Product\Models\Product;
use Modules\Purchasing\Models\PurchaseOrder;
use Modules\Purchasing\Models\PurchaseOrderItem;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class PurchaseOrderTest extends TestCase
{
    use RefreshDatabase, WithRoles;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
        $this->setUpRoles();
    }

    public function test_admin_can_create_draft_purchase_order(): void
    {
        $user = $this->createAdminUser();
        $supplier = Partner::factory()->supplier()->create();
        $warehouse = Warehouse::factory()->create();
        $product = Product::factory()->create(['unit' => 'karton', 'cost' => 85000]);

        $response = $this->actingAs($user)->post(route('module.purchasing.purchase-orders.store', [], false), [
            'partner_id' => $supplier->id,
            'warehouse_id' => $warehouse->id,
            'ordered_at' => now()->toDateString(),
            'expected_at' => now()->addDays(5)->toDateString(),
            'notes' => 'Test PO',
            'items' => [
                [
                    'product_id' => $product->id,
                    'quantity_ordered' => 100,
                    'unit_price' => 85000,
                    'unit' => 'karton',
                ],
            ],
        ]);

        $po = PurchaseOrder::query()->first();
        $this->assertNotNull($po);
        $response->assertRedirect(route('module.purchasing.purchase-orders.show', $po, false));
        $this->assertSame(PurchaseOrder::STATUS_DRAFT, $po->status);
        $this->assertMatchesRegularExpression('/^PO-\d{4}-\d{4}$/', $po->po_number);
        $this->assertEquals(8500000, (float) $po->fresh()->total_amount);
        $this->assertDatabaseHas('purchase_order_items', [
            'purchase_order_id' => $po->id,
            'product_id' => $product->id,
            'quantity_ordered' => 100,
        ]);
    }

    public function test_admin_can_submit_on_create(): void
    {
        $user = $this->createAdminUser();
        $supplier = Partner::factory()->supplier()->create();
        $warehouse = Warehouse::factory()->create();
        $product = Product::factory()->create();

        $this->actingAs($user)->post(route('module.purchasing.purchase-orders.store', [], false), [
            'partner_id' => $supplier->id,
            'warehouse_id' => $warehouse->id,
            'ordered_at' => now()->toDateString(),
            'submit' => true,
            'items' => [
                [
                    'product_id' => $product->id,
                    'quantity_ordered' => 10,
                    'unit_price' => 1000,
                    'unit' => 'pcs',
                ],
            ],
        ]);

        $this->assertDatabaseHas('purchase_orders', [
            'partner_id' => $supplier->id,
            'status' => PurchaseOrder::STATUS_SUBMITTED,
        ]);
    }

    public function test_status_transitions_draft_to_submitted_to_approved(): void
    {
        $user = $this->createAdminUser();
        $po = PurchaseOrder::factory()->create(['status' => PurchaseOrder::STATUS_DRAFT]);
        PurchaseOrderItem::factory()->create(['purchase_order_id' => $po->id]);

        $this->actingAs($user)
            ->post(route('module.purchasing.purchase-orders.submit', $po, false))
            ->assertSessionHas('success');

        $this->assertSame(PurchaseOrder::STATUS_SUBMITTED, $po->fresh()->status);

        $this->actingAs($user)
            ->post(route('module.purchasing.purchase-orders.approve', $po, false))
            ->assertSessionHas('success');

        $this->assertSame(PurchaseOrder::STATUS_APPROVED, $po->fresh()->status);
    }

    public function test_cannot_cancel_partially_received_purchase_order(): void
    {
        $user = $this->createAdminUser();
        $po = PurchaseOrder::factory()->create(['status' => PurchaseOrder::STATUS_PARTIAL_RECEIVED]);

        $this->actingAs($user)
            ->post(route('module.purchasing.purchase-orders.cancel', $po, false))
            ->assertSessionHas('error');

        $this->assertSame(PurchaseOrder::STATUS_PARTIAL_RECEIVED, $po->fresh()->status);
    }

    public function test_total_amount_is_calculated_from_items(): void
    {
        $user = $this->createAdminUser();
        $supplier = Partner::factory()->supplier()->create();
        $warehouse = Warehouse::factory()->create();
        $productA = Product::factory()->create();
        $productB = Product::factory()->create();

        $this->actingAs($user)->post(route('module.purchasing.purchase-orders.store', [], false), [
            'partner_id' => $supplier->id,
            'warehouse_id' => $warehouse->id,
            'ordered_at' => now()->toDateString(),
            'items' => [
                ['product_id' => $productA->id, 'quantity_ordered' => 100, 'unit_price' => 85000, 'unit' => 'karton'],
                ['product_id' => $productB->id, 'quantity_ordered' => 200, 'unit_price' => 19500, 'unit' => 'pack'],
            ],
        ]);

        $po = PurchaseOrder::query()->first();
        $this->assertEquals(12400000, (float) $po->total_amount);
    }

    public function test_non_supplier_partner_is_rejected(): void
    {
        $user = $this->createAdminUser();
        $customer = Partner::factory()->create(['supplier_rank' => 0, 'customer_rank' => 1]);
        $warehouse = Warehouse::factory()->create();
        $product = Product::factory()->create();

        $this->actingAs($user)->post(route('module.purchasing.purchase-orders.store', [], false), [
            'partner_id' => $customer->id,
            'warehouse_id' => $warehouse->id,
            'ordered_at' => now()->toDateString(),
            'items' => [
                ['product_id' => $product->id, 'quantity_ordered' => 1, 'unit_price' => 100, 'unit' => 'pcs'],
            ],
        ])->assertSessionHasErrors('partner_id');
    }

    public function test_only_draft_can_be_updated(): void
    {
        $user = $this->createAdminUser();
        $po = PurchaseOrder::factory()->submitted()->create();
        PurchaseOrderItem::factory()->create(['purchase_order_id' => $po->id]);

        $this->actingAs($user)->patch(route('module.purchasing.purchase-orders.update', $po, false), [
            'partner_id' => $po->partner_id,
            'warehouse_id' => $po->warehouse_id,
            'ordered_at' => now()->toDateString(),
            'items' => [
                ['product_id' => Product::factory()->create()->id, 'quantity_ordered' => 5, 'unit_price' => 10, 'unit' => 'pcs'],
            ],
        ])->assertSessionHas('error');
    }
}
