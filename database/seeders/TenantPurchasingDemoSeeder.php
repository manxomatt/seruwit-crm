<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Modules\Inventory\Models\Warehouse;
use Modules\Partners\Models\Partner;
use Modules\Product\Models\Product;
use Modules\Purchasing\Models\PurchaseOrder;
use Modules\Purchasing\Models\PurchaseOrderItem;

/**
 * Seeds 10 demo purchase orders with mixed statuses.
 *
 *   php artisan tenants:seed --class=TenantPurchasingDemoSeeder --tenants={id}
 */
class TenantPurchasingDemoSeeder extends Seeder
{
    public function run(): void
    {
        if (! class_exists(PurchaseOrder::class)) {
            $this->command?->warn('Purchasing module classes not found.');

            return;
        }

        if (! \Schema::hasTable('purchase_orders')) {
            $this->command?->warn('purchase_orders table missing. Install the purchasing module first.');

            return;
        }

        $userId = User::query()->value('id');
        $warehouse = Warehouse::query()->where('status', 'active')->first()
            ?? Warehouse::factory()->create(['name' => 'Gudang Utama', 'status' => 'active']);

        $suppliers = Partner::query()->where('supplier_rank', '>', 0)->take(5)->get();

        if ($suppliers->count() < 3) {
            $needed = 3 - $suppliers->count();
            for ($i = 0; $i < $needed; $i++) {
                $suppliers->push(Partner::factory()->supplier()->create([
                    'name' => ['PT Sumber Makmur', 'CV Mitra Sejati', 'PT Global Supply'][$i] ?? fake()->company(),
                ]));
            }
        }

        $products = Product::query()
            ->where('status', 'active')
            ->where(function ($query): void {
                $query->whereNull('category')->orWhere('category', '!=', 'service');
            })
            ->take(12)
            ->get();

        if ($products->count() < 3) {
            for ($i = $products->count(); $i < 6; $i++) {
                $products->push(Product::factory()->create([
                    'status' => 'active',
                    'unit' => fake()->randomElement(['pcs', 'karton', 'pack']),
                    'cost' => fake()->numberBetween(5000, 90000),
                    'category' => 'merchandise',
                ]));
            }
        }

        $scenarios = [
            ['status' => PurchaseOrder::STATUS_DRAFT, 'days_ago' => 1, 'expected_in' => 7, 'items' => 2, 'partial' => false],
            ['status' => PurchaseOrder::STATUS_DRAFT, 'days_ago' => 2, 'expected_in' => null, 'items' => 1, 'partial' => false],
            ['status' => PurchaseOrder::STATUS_SUBMITTED, 'days_ago' => 3, 'expected_in' => 5, 'items' => 3, 'partial' => false],
            ['status' => PurchaseOrder::STATUS_SUBMITTED, 'days_ago' => 4, 'expected_in' => 10, 'items' => 2, 'partial' => false],
            ['status' => PurchaseOrder::STATUS_APPROVED, 'days_ago' => 5, 'expected_in' => 3, 'items' => 2, 'partial' => false],
            ['status' => PurchaseOrder::STATUS_APPROVED, 'days_ago' => 6, 'expected_in' => 4, 'items' => 3, 'partial' => false],
            ['status' => PurchaseOrder::STATUS_PARTIAL_RECEIVED, 'days_ago' => 8, 'expected_in' => 1, 'items' => 2, 'partial' => true],
            ['status' => PurchaseOrder::STATUS_PARTIAL_RECEIVED, 'days_ago' => 10, 'expected_in' => -1, 'items' => 3, 'partial' => true],
            ['status' => PurchaseOrder::STATUS_FULLY_RECEIVED, 'days_ago' => 12, 'expected_in' => -2, 'items' => 2, 'partial' => false],
            ['status' => PurchaseOrder::STATUS_CLOSED, 'days_ago' => 20, 'expected_in' => -10, 'items' => 2, 'partial' => false],
        ];

        $created = 0;

        foreach ($scenarios as $index => $scenario) {
            $supplier = $suppliers[$index % $suppliers->count()];
            $orderedAt = now()->subDays($scenario['days_ago']);
            $expectedAt = $scenario['expected_in'] === null
                ? null
                : now()->subDays($scenario['days_ago'])->addDays((int) $scenario['expected_in']);

            $po = PurchaseOrder::query()->create([
                'partner_id' => $supplier->id,
                'warehouse_id' => $warehouse->id,
                'created_by' => $userId,
                'po_number' => PurchaseOrder::nextNumber(),
                'status' => $scenario['status'],
                'ordered_at' => $orderedAt->toDateString(),
                'expected_at' => $expectedAt?->toDateString(),
                'notes' => 'Demo PO #'.($index + 1),
                'total_amount' => 0,
            ]);

            $lineProducts = $products->shuffle()->take($scenario['items']);

            foreach ($lineProducts as $product) {
                $qtyOrdered = fake()->randomElement([20, 40, 50, 100, 200]);
                $qtyReceived = match ($scenario['status']) {
                    PurchaseOrder::STATUS_FULLY_RECEIVED, PurchaseOrder::STATUS_CLOSED => $qtyOrdered,
                    PurchaseOrder::STATUS_PARTIAL_RECEIVED => (int) floor($qtyOrdered * fake()->randomElement([0.3, 0.5, 0.6])),
                    default => 0,
                };

                PurchaseOrderItem::query()->create([
                    'purchase_order_id' => $po->id,
                    'product_id' => $product->id,
                    'quantity_ordered' => $qtyOrdered,
                    'quantity_received' => $qtyReceived,
                    'unit_price' => $product->cost ?: fake()->numberBetween(5000, 85000),
                    'unit' => $product->stock_unit ?: $product->unit ?: 'pcs',
                    'notes' => null,
                ]);
            }

            $po->recalculateTotal();
            $created++;
        }

        $this->command?->info("Seeded {$created} purchase orders.");
    }
}
