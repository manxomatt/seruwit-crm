<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Modules\Inventory\Models\Warehouse;
use Modules\Inventory\Models\WarehouseLocation;
use Modules\Inventory\Support\StockMovementRecorder;
use Modules\Partners\Models\Partner;
use Modules\Product\Models\Product;
use Modules\Purchasing\Models\GoodReceiptNote;
use Modules\Purchasing\Models\GoodReceiptNoteItem;
use Modules\Purchasing\Models\PurchaseOrder;
use Modules\Purchasing\Models\PurchaseOrderItem;
use Modules\Purchasing\Support\GrnConfirmationService;

/**
 * Seeds 10 demo purchase orders with consistent GRNs for received statuses.
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

        $repaired = $this->repairReceivedOrdersWithoutGrn();
        if ($repaired > 0) {
            $this->command?->info("Repaired {$repaired} purchase order(s) that had received qty without GRN.");
        }

        if (PurchaseOrder::query()->where('notes', 'like', 'Demo PO #%')->exists()) {
            $this->command?->info('Demo purchase orders already present, skipping create.');

            return;
        }

        $userId = User::query()->value('id');
        $warehouse = Warehouse::query()->where('status', 'active')->orderBy('id')->first()
            ?? Warehouse::factory()->create(['name' => 'Gudang Utama', 'status' => 'active']);

        if ($warehouse->locations()->where('code', 'STOCK')->doesntExist()) {
            $warehouse->createDefaultLocations();
        }

        $stockLocation = $warehouse->locations()->where('code', 'STOCK')->first();

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
            ->where(function ($query): void {
                $query->whereNotNull('parent_id')->orWhereDoesntHave('variants');
            })
            ->orderBy('id')
            ->take(24)
            ->get();

        if ($products->count() < 3) {
            for ($i = $products->count(); $i < 6; $i++) {
                $products->push(Product::factory()->create([
                    'status' => 'active',
                    'unit' => fake()->randomElement(['pcs', 'karton', 'pack']),
                    'cost' => fake()->numberBetween(5000, 90000),
                    'category' => 'merchandise',
                    'is_storable' => true,
                ]));
            }
        }

        $scenarios = [
            ['status' => PurchaseOrder::STATUS_DRAFT, 'days_ago' => 1, 'expected_in' => 7, 'items' => 2],
            ['status' => PurchaseOrder::STATUS_DRAFT, 'days_ago' => 2, 'expected_in' => null, 'items' => 1],
            ['status' => PurchaseOrder::STATUS_SUBMITTED, 'days_ago' => 3, 'expected_in' => 5, 'items' => 3],
            ['status' => PurchaseOrder::STATUS_SUBMITTED, 'days_ago' => 4, 'expected_in' => 10, 'items' => 2],
            ['status' => PurchaseOrder::STATUS_APPROVED, 'days_ago' => 5, 'expected_in' => 3, 'items' => 2],
            ['status' => PurchaseOrder::STATUS_APPROVED, 'days_ago' => 6, 'expected_in' => 4, 'items' => 3],
            ['status' => PurchaseOrder::STATUS_PARTIAL_RECEIVED, 'days_ago' => 8, 'expected_in' => 1, 'items' => 2, 'receive' => 'partial'],
            ['status' => PurchaseOrder::STATUS_PARTIAL_RECEIVED, 'days_ago' => 10, 'expected_in' => -1, 'items' => 3, 'receive' => 'partial'],
            ['status' => PurchaseOrder::STATUS_FULLY_RECEIVED, 'days_ago' => 12, 'expected_in' => -2, 'items' => 2, 'receive' => 'full'],
            ['status' => PurchaseOrder::STATUS_CLOSED, 'days_ago' => 20, 'expected_in' => -10, 'items' => 2, 'receive' => 'full', 'close' => true],
        ];

        $created = 0;
        $previousAuthId = auth()->id();
        if ($userId) {
            auth()->loginUsingId($userId);
        }

        try {
            foreach ($scenarios as $index => $scenario) {
                $supplier = $suppliers[$index % $suppliers->count()];
                $orderedAt = now()->subDays($scenario['days_ago']);
                $expectedAt = $scenario['expected_in'] === null
                    ? null
                    : now()->subDays($scenario['days_ago'])->addDays((int) $scenario['expected_in']);

                $initialStatus = isset($scenario['receive'])
                    ? PurchaseOrder::STATUS_APPROVED
                    : $scenario['status'];

                $po = PurchaseOrder::query()->create([
                    'partner_id' => $supplier->id,
                    'warehouse_id' => $warehouse->id,
                    'created_by' => $userId,
                    'po_number' => PurchaseOrder::nextNumber(),
                    'status' => $initialStatus,
                    'ordered_at' => $orderedAt->toDateString(),
                    'expected_at' => $expectedAt?->toDateString(),
                    'notes' => 'Demo PO #'.($index + 1),
                    'total_amount' => 0,
                ]);

                $lineProducts = $products->values()->slice($index * 2, $scenario['items']);
                if ($lineProducts->count() < $scenario['items']) {
                    $lineProducts = $products->shuffle()->take($scenario['items']);
                }

                $poItems = collect();
                foreach ($lineProducts as $product) {
                    $qtyOrdered = [20, 40, 50, 100, 200][$index % 5];

                    $poItems->push(PurchaseOrderItem::query()->create([
                        'purchase_order_id' => $po->id,
                        'product_id' => $product->id,
                        'quantity_ordered' => $qtyOrdered,
                        'quantity_received' => 0,
                        'unit_price' => $product->cost ?: fake()->numberBetween(5000, 85000),
                        'unit' => $product->stock_unit ?: $product->unit ?: 'pcs',
                        'notes' => null,
                    ]));
                }

                $po->recalculateTotal();

                if (isset($scenario['receive'])) {
                    $this->confirmReceipt(
                        $po,
                        $poItems,
                        $stockLocation,
                        $scenario['receive'] === 'partial',
                        $orderedAt->copy()->addDays(2),
                    );

                    if (($scenario['close'] ?? false) === true) {
                        $po->update(['status' => PurchaseOrder::STATUS_CLOSED]);
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

        $this->command?->info("Seeded {$created} purchase orders with consistent GRNs where applicable.");
    }

    /**
     * Backfill confirmed GRNs + stock movements for received POs that were
     * seeded with quantity_received only (no GRN documents). Also normalizes
     * orphan received statuses that have nothing to receive.
     */
    private function repairReceivedOrdersWithoutGrn(): int
    {
        $repaired = 0;

        $orphans = PurchaseOrder::query()
            ->with('items')
            ->whereIn('status', [
                PurchaseOrder::STATUS_PARTIAL_RECEIVED,
                PurchaseOrder::STATUS_FULLY_RECEIVED,
                PurchaseOrder::STATUS_CLOSED,
            ])
            ->whereDoesntHave('goodReceiptNotes')
            ->get();

        foreach ($orphans as $po) {
            $hasReceivedQty = $po->items->contains(
                fn (PurchaseOrderItem $item): bool => (float) $item->quantity_received > 0
            );

            if (! $hasReceivedQty) {
                if ($po->items->isEmpty()) {
                    $po->delete();
                } else {
                    $po->update(['status' => PurchaseOrder::STATUS_APPROVED]);
                }
                $repaired++;

                continue;
            }

            $location = WarehouseLocation::query()
                ->where('warehouse_id', $po->warehouse_id)
                ->where('code', 'STOCK')
                ->first();

            $userId = User::query()->value('id');

            DB::transaction(function () use ($po, $location, $userId, &$repaired): void {
                $grn = GoodReceiptNote::query()->create([
                    'purchase_order_id' => $po->id,
                    'warehouse_id' => $po->warehouse_id,
                    'received_by' => $userId,
                    'grn_number' => GoodReceiptNote::nextNumber(),
                    'status' => GoodReceiptNote::STATUS_CONFIRMED,
                    'received_at' => $po->ordered_at?->toDateString() ?? now()->toDateString(),
                    'notes' => 'Backfilled GRN for demo consistency',
                ]);

                foreach ($po->items as $itemIndex => $item) {
                    $qty = (float) $item->quantity_received;
                    if ($qty <= 0) {
                        continue;
                    }

                    $grnItem = GoodReceiptNoteItem::query()->create([
                        'good_receipt_note_id' => $grn->id,
                        'po_item_id' => $item->id,
                        'location_id' => $location?->id,
                        'quantity_received' => $qty,
                        'batch_number' => sprintf('DEMO-RPR-%d', $item->id),
                        'expiry_date' => now()->addMonths(6 + ($itemIndex % 6))->toDateString(),
                        'notes' => null,
                    ]);

                    StockMovementRecorder::record([
                        'product_id' => $item->product_id,
                        'warehouse_id' => $po->warehouse_id,
                        'location_id' => $location?->id,
                        'type' => 'in',
                        'quantity' => $qty,
                        'source_type' => 'grn',
                        'source_id' => $grnItem->id,
                        'reference_code' => $grn->grn_number,
                        'batch_number' => $grnItem->batch_number,
                        'expiry_date' => $grnItem->expiry_date?->toDateString(),
                        'notes' => 'Backfilled from inconsistent demo PO',
                        'recorded_by' => $userId,
                        'recorded_at' => now()->subDays(1),
                    ]);
                }

                $repaired++;
            });
        }

        return $repaired;
    }

    /**
     * @param  \Illuminate\Support\Collection<int, PurchaseOrderItem>  $poItems
     */
    private function confirmReceipt(
        PurchaseOrder $po,
        $poItems,
        ?WarehouseLocation $stockLocation,
        bool $partial,
        \Carbon\CarbonInterface $receivedAt,
    ): void {
        $grn = GoodReceiptNote::query()->create([
            'purchase_order_id' => $po->id,
            'warehouse_id' => $po->warehouse_id,
            'received_by' => auth()->id(),
            'grn_number' => GoodReceiptNote::nextNumber(),
            'status' => GoodReceiptNote::STATUS_DRAFT,
            'received_at' => $receivedAt->toDateString(),
            'notes' => $partial ? 'Demo partial receipt' : 'Demo full receipt',
        ]);

        foreach ($poItems->values() as $index => $item) {
            $ordered = (float) $item->quantity_ordered;
            $qty = $partial
                ? max(1, (int) floor($ordered * [0.3, 0.5, 0.6][$index % 3]))
                : $ordered;

            GoodReceiptNoteItem::query()->create([
                'good_receipt_note_id' => $grn->id,
                'po_item_id' => $item->id,
                'location_id' => $stockLocation?->id,
                'quantity_received' => $qty,
                'batch_number' => sprintf('DEMO-LOT-%d-%d', $po->id, $item->id),
                'expiry_date' => now()->addMonths(4 + ($index % 8))->toDateString(),
                'notes' => null,
            ]);
        }

        app(GrnConfirmationService::class)->confirm($grn->fresh(['items']));
    }
}
