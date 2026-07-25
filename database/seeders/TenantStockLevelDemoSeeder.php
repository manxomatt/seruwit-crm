<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Modules\Inventory\Models\StockLevel;
use Modules\Inventory\Models\Warehouse;
use Modules\Inventory\Models\WarehouseLocation;
use Modules\Inventory\Support\StockMovementRecorder;
use Modules\Product\Models\Product;

/**
 * Seeds demo stock levels for existing products into 3 of 5 warehouses.
 * Leaves Gudang Transit Bakauheni and Gudang Sparepart Pringsewu empty.
 *
 *   php artisan tenants:seed --class=TenantStockLevelDemoSeeder --tenants={id}
 */
class TenantStockLevelDemoSeeder extends Seeder
{
    /**
     * @var list<string>
     */
    private const STOCKED_WAREHOUSE_NAMES = [
        'Gudang Pusat Bandar Lampung',
        'Gudang Cabang Metro',
        'Gudang Cold Storage',
    ];

    /**
     * @var list<string>
     */
    private const EMPTY_WAREHOUSE_NAMES = [
        'Gudang Transit Bakauheni',
        'Gudang Sparepart Pringsewu',
    ];

    public function run(): void
    {
        if (! class_exists(StockLevel::class) || ! \Schema::hasTable('stock_levels')) {
            $this->command?->warn('Inventory stock_levels table missing. Install the inventory module first.');

            return;
        }

        $warehouses = Warehouse::query()
            ->where('status', 'active')
            ->whereIn('name', self::STOCKED_WAREHOUSE_NAMES)
            ->orderBy('name')
            ->get();

        if ($warehouses->count() < 3) {
            $warehouses = Warehouse::query()
                ->where('status', 'active')
                ->orderBy('id')
                ->take(3)
                ->get();
        }

        if ($warehouses->isEmpty()) {
            $this->command?->warn('No active warehouses found. Seed warehouses first.');

            return;
        }

        $products = Product::query()
            ->where('status', 'active')
            ->where(function ($query): void {
                $query->whereNull('category')->orWhere('category', '!=', 'service');
            })
            ->where(function ($query): void {
                $query->whereNull('is_storable')->orWhere('is_storable', true);
            })
            ->where(function ($query): void {
                $query->whereNotNull('parent_id')
                    ->orWhereDoesntHave('variants');
            })
            ->orderBy('id')
            ->get();

        if ($products->isEmpty()) {
            $this->command?->warn('No storable products found. Seed products first.');

            return;
        }

        $userId = User::query()->value('id');
        $created = 0;
        $skipped = 0;

        foreach ($warehouses as $warehouse) {
            $stockLocation = $this->resolveStockLocation($warehouse);
            $rackLocations = $this->resolveRackLocations($warehouse);

            foreach ($products as $index => $product) {
                $location = $this->pickLocation($stockLocation, $rackLocations, $index, $warehouse->name);
                $batchNumber = $this->batchNumberFor($product, $warehouse, $index);
                $expiryDate = $batchNumber !== '' ? now()->addMonths(3 + ($index % 18))->toDateString() : null;
                $quantity = $this->quantityFor($product->id, $warehouse->id, $index);

                $alreadyExists = StockLevel::query()
                    ->where('product_id', $product->id)
                    ->where('warehouse_id', $warehouse->id)
                    ->where('location_id', $location?->id)
                    ->where('batch_number', $batchNumber)
                    ->exists();

                if ($alreadyExists) {
                    $skipped++;

                    continue;
                }

                StockMovementRecorder::record([
                    'product_id' => $product->id,
                    'warehouse_id' => $warehouse->id,
                    'location_id' => $location?->id,
                    'type' => 'in',
                    'quantity' => $quantity,
                    'batch_number' => $batchNumber !== '' ? $batchNumber : null,
                    'expiry_date' => $expiryDate,
                    'source_type' => 'demo_seed',
                    'source_id' => null,
                    'reference_code' => sprintf('DEMO-SL-%d-%d', $warehouse->id, $product->id),
                    'notes' => 'Demo stock level seed',
                    'recorded_by' => $userId,
                    'recorded_at' => now()->subDays(($index % 14) + 1),
                ]);

                if ($index % 9 === 0) {
                    $level = StockLevel::query()
                        ->where('product_id', $product->id)
                        ->where('warehouse_id', $warehouse->id)
                        ->where('location_id', $location?->id)
                        ->where('batch_number', $batchNumber)
                        ->first();

                    if ($level !== null) {
                        $reserved = min(5, max(1, (int) floor((float) $level->on_hand * 0.1)));
                        $level->update(['reserved' => $reserved]);
                    }
                }

                $created++;
            }

            $this->command?->info(sprintf(
                'Stocked: %s (%d products)',
                $warehouse->name,
                $products->count(),
            ));
        }

        $emptyNames = Warehouse::query()
            ->whereIn('name', self::EMPTY_WAREHOUSE_NAMES)
            ->pluck('name');

        foreach ($emptyNames as $name) {
            $this->command?->info("Left empty: {$name}");
        }

        $this->command?->info("Done. {$created} stock levels created, {$skipped} skipped.");
    }

    private function resolveStockLocation(Warehouse $warehouse): ?WarehouseLocation
    {
        return $warehouse->locations()
            ->where('code', 'STOCK')
            ->first()
            ?? $warehouse->locations()->where('is_default', true)->where('type', 'internal')->first();
    }

    /**
     * @return list<WarehouseLocation>
     */
    private function resolveRackLocations(Warehouse $warehouse): array
    {
        return $warehouse->locations()
            ->where('is_default', false)
            ->where('type', 'internal')
            ->orderBy('sort_order')
            ->get()
            ->all();
    }

    /**
     * @param  list<WarehouseLocation>  $rackLocations
     */
    private function pickLocation(
        ?WarehouseLocation $stockLocation,
        array $rackLocations,
        int $index,
        string $warehouseName,
    ): ?WarehouseLocation {
        if ($warehouseName === 'Gudang Pusat Bandar Lampung' && $rackLocations !== [] && $index % 4 === 0) {
            return $rackLocations[$index % count($rackLocations)];
        }

        return $stockLocation;
    }

    private function batchNumberFor(Product $product, Warehouse $warehouse, int $index): string
    {
        if ($warehouse->name !== 'Gudang Cold Storage') {
            return '';
        }

        if ($index % 3 !== 0) {
            return '';
        }

        return sprintf('LOT-%s-%04d', now()->format('ym'), $product->id % 10000);
    }

    private function quantityFor(int $productId, int $warehouseId, int $index): int
    {
        if ($index % 11 === 0) {
            return 3 + ($productId % 5);
        }

        return 25 + (($productId * 7 + $warehouseId * 13 + $index) % 475);
    }
}
