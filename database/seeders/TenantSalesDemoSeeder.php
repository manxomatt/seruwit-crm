<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Schema;
use Modules\Inventory\Models\StockLevel;
use Modules\Inventory\Models\Warehouse;
use Modules\Inventory\Models\WarehouseLocation;
use Modules\Partners\Models\Partner;
use Modules\Product\Models\Product;
use Modules\Sales\Models\GoodsIssueNote;
use Modules\Sales\Models\GoodsIssueNoteItem;
use Modules\Sales\Models\SalesOrder;
use Modules\Sales\Models\SalesOrderItem;
use Modules\Sales\Support\GinConfirmationService;
use Modules\Sales\Support\SalesOrderConfirmationService;

/**
 * Seeds 10 demo sales orders with consistent GINs for delivered statuses.
 *
 *   php artisan tenants:seed --class=TenantSalesDemoSeeder --tenants={id}
 */
class TenantSalesDemoSeeder extends Seeder
{
    public function run(): void
    {
        if (! class_exists(SalesOrder::class)) {
            $this->command?->warn('Sales module classes not found.');

            return;
        }

        if (! Schema::hasTable('sales_orders')) {
            $this->command?->warn('sales_orders table missing. Install the sales module first.');

            return;
        }

        if (SalesOrder::query()->where('notes', 'like', 'Demo SO #%')->exists()) {
            $this->command?->info('Demo sales orders already present, skipping create.');

            return;
        }

        $userId = User::query()->value('id');
        $warehouse = Warehouse::query()->where('status', 'active')->orderBy('id')->first()
            ?? Warehouse::factory()->create(['name' => 'Gudang Utama', 'status' => 'active']);

        if ($warehouse->locations()->where('code', 'STOCK')->doesntExist()) {
            $warehouse->createDefaultLocations();
        }

        $stockLocation = $warehouse->locations()->where('code', 'STOCK')->first();

        $customers = Partner::query()->where('customer_rank', '>', 0)->take(5)->get();

        if ($customers->count() < 3) {
            $needed = 3 - $customers->count();
            for ($i = 0; $i < $needed; $i++) {
                $customers->push(Partner::factory()->create([
                    'name' => ['Toko Berkah Jaya', 'CV Mitra Niaga', 'UD Sentosa Abadi'][$i] ?? fake()->company(),
                    'customer_rank' => 1,
                    'supplier_rank' => 0,
                    'credit_limit' => null,
                ]));
            }
        } else {
            Partner::query()
                ->whereIn('id', $customers->pluck('id'))
                ->whereNotNull('credit_limit')
                ->where('credit_limit', '>', 0)
                ->where('credit_limit', '<', 50_000_000)
                ->update(['credit_limit' => null]);
        }

        $products = Product::query()
            ->where('status', 'active')
            ->where(function ($query): void {
                $query->whereNull('category')->orWhere('category', '!=', 'service');
            })
            ->where(function ($query): void {
                $query->whereNotNull('parent_id')->orWhereDoesntHave('variants');
            })
            ->orderBy('id')
            ->take(24)
            ->get();

        if ($products->count() < 6) {
            for ($i = $products->count(); $i < 8; $i++) {
                $products->push(Product::factory()->create([
                    'status' => 'active',
                    'unit' => fake()->randomElement(['pcs', 'karton', 'pack']),
                    'price' => fake()->numberBetween(8000, 120000),
                    'cost' => fake()->numberBetween(5000, 90000),
                    'category' => 'merchandise',
                    'is_storable' => true,
                ]));
            }
        }

        foreach ($products as $product) {
            $this->ensureStock((int) $product->id, (int) $warehouse->id, $stockLocation?->id, 5_000);
        }

        $scenarios = [
            ['status' => SalesOrder::STATUS_DRAFT, 'days_ago' => 1, 'promised_in' => 5, 'items' => 2],
            ['status' => SalesOrder::STATUS_DRAFT, 'days_ago' => 2, 'promised_in' => null, 'items' => 1],
            ['status' => SalesOrder::STATUS_CONFIRMED, 'days_ago' => 3, 'promised_in' => 4, 'items' => 2, 'confirm' => true],
            ['status' => SalesOrder::STATUS_CONFIRMED, 'days_ago' => 4, 'promised_in' => 7, 'items' => 3, 'confirm' => true],
            ['status' => SalesOrder::STATUS_PARTIAL_DELIVERED, 'days_ago' => 6, 'promised_in' => 2, 'items' => 2, 'issue' => 'partial'],
            ['status' => SalesOrder::STATUS_PARTIAL_DELIVERED, 'days_ago' => 8, 'promised_in' => 1, 'items' => 3, 'issue' => 'partial'],
            ['status' => SalesOrder::STATUS_FULLY_DELIVERED, 'days_ago' => 10, 'promised_in' => -1, 'items' => 2, 'issue' => 'full'],
            ['status' => SalesOrder::STATUS_FULLY_DELIVERED, 'days_ago' => 12, 'promised_in' => -2, 'items' => 2, 'issue' => 'full'],
            ['status' => SalesOrder::STATUS_CLOSED, 'days_ago' => 18, 'promised_in' => -8, 'items' => 2, 'issue' => 'full', 'close' => true],
            ['status' => SalesOrder::STATUS_CANCELLED, 'days_ago' => 5, 'promised_in' => null, 'items' => 1, 'cancel' => true],
        ];

        $created = 0;
        $previousAuthId = auth()->id();
        if ($userId) {
            auth()->loginUsingId($userId);
        }

        try {
            foreach ($scenarios as $index => $scenario) {
                $customer = $customers[$index % $customers->count()];
                $orderedAt = now()->subDays($scenario['days_ago']);
                $promisedAt = $scenario['promised_in'] === null
                    ? null
                    : $orderedAt->copy()->addDays((int) $scenario['promised_in']);

                $so = SalesOrder::query()->create([
                    'partner_id' => $customer->id,
                    'warehouse_id' => $warehouse->id,
                    'created_by' => $userId,
                    'so_number' => SalesOrder::nextNumber(),
                    'status' => SalesOrder::STATUS_DRAFT,
                    'ordered_at' => $orderedAt->toDateString(),
                    'promised_at' => $promisedAt?->toDateString(),
                    'notes' => 'Demo SO #'.($index + 1),
                    'total_amount' => 0,
                ]);

                $lineProducts = $products->values()->slice($index * 2, $scenario['items']);
                if ($lineProducts->count() < $scenario['items']) {
                    $lineProducts = $products->shuffle()->take($scenario['items']);
                }

                $soItems = collect();
                foreach ($lineProducts as $product) {
                    $qtyOrdered = [10, 20, 25, 40, 50][$index % 5];

                    $soItems->push(SalesOrderItem::query()->create([
                        'sales_order_id' => $so->id,
                        'product_id' => $product->id,
                        'quantity_ordered' => $qtyOrdered,
                        'quantity_delivered' => 0,
                        'unit_price' => $product->price ?: ($product->cost ?: fake()->numberBetween(8000, 95000)),
                        'unit' => $product->stock_unit ?: $product->unit ?: 'pcs',
                        'notes' => null,
                    ]));
                }

                $so->recalculateTotal();

                if (($scenario['cancel'] ?? false) === true) {
                    $so->update(['status' => SalesOrder::STATUS_CANCELLED]);
                    $created++;

                    continue;
                }

                if (($scenario['confirm'] ?? false) === true || isset($scenario['issue'])) {
                    foreach ($soItems as $item) {
                        $this->ensureStock(
                            (int) $item->product_id,
                            (int) $warehouse->id,
                            $stockLocation?->id,
                            (float) $item->quantity_ordered + 500,
                        );
                    }

                    app(SalesOrderConfirmationService::class)->confirm($so->fresh(['items.packaging', 'partner']));
                }

                if (isset($scenario['issue'])) {
                    $this->confirmIssue(
                        $so->fresh(['items']),
                        $soItems,
                        $stockLocation,
                        $scenario['issue'] === 'partial',
                        $orderedAt->copy()->addDays(2),
                    );

                    if (($scenario['close'] ?? false) === true) {
                        $so->fresh()->update(['status' => SalesOrder::STATUS_CLOSED]);
                    }
                }

                $created++;
            }
        } finally {
            if ($previousAuthId) {
                auth()->loginUsingId($previousAuthId);
            } else {
                auth()->logout();
            }
        }

        $this->command?->info("Seeded {$created} sales orders with consistent GINs where applicable.");
    }

    private function ensureStock(int $productId, int $warehouseId, ?int $locationId, float $minimum): void
    {
        $level = StockLevel::query()->firstOrCreate(
            [
                'product_id' => $productId,
                'warehouse_id' => $warehouseId,
                'location_id' => $locationId,
                'batch_number' => '',
            ],
            [
                'on_hand' => 0,
                'reserved' => 0,
                'expiry_date' => null,
            ],
        );

        $available = (float) $level->on_hand - (float) $level->reserved;

        if ($available < $minimum) {
            $level->update(['on_hand' => (float) $level->reserved + $minimum]);
        }
    }

    /**
     * @param  \Illuminate\Support\Collection<int, SalesOrderItem>  $soItems
     */
    private function confirmIssue(
        SalesOrder $so,
        $soItems,
        ?WarehouseLocation $stockLocation,
        bool $partial,
        \Carbon\CarbonInterface $issuedAt,
    ): void {
        $gin = GoodsIssueNote::query()->create([
            'sales_order_id' => $so->id,
            'warehouse_id' => $so->warehouse_id,
            'issued_by' => auth()->id(),
            'gin_number' => GoodsIssueNote::nextNumber(),
            'status' => GoodsIssueNote::STATUS_DRAFT,
            'issued_at' => $issuedAt->toDateString(),
            'notes' => $partial ? 'Demo partial issue' : 'Demo full issue',
        ]);

        foreach ($soItems->values() as $index => $item) {
            $ordered = (float) $item->quantity_ordered;
            $qty = $partial
                ? max(1, (int) floor($ordered * [0.3, 0.5, 0.6][$index % 3]))
                : $ordered;

            GoodsIssueNoteItem::query()->create([
                'goods_issue_note_id' => $gin->id,
                'so_item_id' => $item->id,
                'location_id' => $stockLocation?->id,
                'quantity_issued' => $qty,
                'batch_number' => sprintf('DEMO-OUT-%d-%d', $so->id, $item->id),
                'expiry_date' => now()->addMonths(3 + ($index % 6))->toDateString(),
                'notes' => null,
            ]);
        }

        app(GinConfirmationService::class)->confirm($gin->fresh(['items']));
    }
}
