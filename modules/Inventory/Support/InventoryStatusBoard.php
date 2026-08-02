<?php

namespace Modules\Inventory\Support;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Schema;
use Modules\Inventory\Models\StockLevel;
use Modules\Inventory\Models\StockMovement;
use Modules\Inventory\Models\StockOpname;
use Modules\Inventory\Models\Warehouse;

/**
 * Inventory overview: warehouse mix, stock health, expiry, putaway, and recent activity.
 *
 * Scoped warehouse roles see only their assigned sites (AccessibleWarehouses).
 */
class InventoryStatusBoard
{
    private const EXPIRY_HORIZON_DAYS = 30;

    /**
     * @return array<string, mixed>
     */
    public function build(int $recentLimit = 8): array
    {
        $warehouseIds = AccessibleWarehouses::ids();
        $hasStockLevels = Schema::hasTable('stock_levels');
        $hasMovements = Schema::hasTable('stock_movements');
        $hasOpnames = Schema::hasTable('stock_opnames');
        $hasLocations = Schema::hasTable('warehouse_locations');
        $hasReorderThreshold = Schema::hasTable('products')
            && Schema::hasColumn('products', 'reorder_threshold');

        $warehousesByStatus = AccessibleWarehouses::query()
            ->selectRaw('status, count(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status');

        $warehousesByKind = AccessibleWarehouses::query()
            ->selectRaw("coalesce(kind, 'warehouse') as kind, count(*) as total")
            ->groupByRaw("coalesce(kind, 'warehouse')")
            ->pluck('total', 'kind');

        $warehousesTotal = (int) $warehousesByStatus->sum();
        $warehousesActive = (int) ($warehousesByStatus['active'] ?? 0);
        $warehousesInactive = (int) ($warehousesByStatus['inactive'] ?? 0);

        $stockQuery = $hasStockLevels ? $this->scopedStockLevels($warehouseIds) : null;
        $onHand = $stockQuery ? (float) (clone $stockQuery)->sum('on_hand') : 0.0;
        $reserved = $stockQuery ? (float) (clone $stockQuery)->sum('reserved') : 0.0;
        $lines = $stockQuery ? (int) (clone $stockQuery)->where('on_hand', '>', 0)->count() : 0;
        $available = round($onHand - $reserved, 2);

        $lowStock = 0;
        if ($stockQuery !== null && $hasReorderThreshold) {
            $lowStock = (int) (clone $stockQuery)
                ->join('products', 'products.id', '=', 'stock_levels.product_id')
                ->selectRaw('stock_levels.product_id, stock_levels.warehouse_id')
                ->groupBy('stock_levels.product_id', 'stock_levels.warehouse_id')
                ->havingRaw(
                    'sum(stock_levels.on_hand - stock_levels.reserved) <= coalesce(max(products.reorder_threshold), 10)'
                )
                ->get()
                ->count();
        } elseif ($stockQuery !== null) {
            $lowStock = (int) (clone $stockQuery)
                ->selectRaw('product_id, warehouse_id')
                ->groupBy('product_id', 'warehouse_id')
                ->havingRaw('sum(on_hand - reserved) <= 10')
                ->get()
                ->count();
        }

        $today = now()->toDateString();
        $horizon = now()->addDays(self::EXPIRY_HORIZON_DAYS)->toDateString();

        $expired = 0;
        $nearExpiry = 0;
        if ($stockQuery !== null && Schema::hasColumn('stock_levels', 'expiry_date')) {
            $expired = (int) (clone $stockQuery)
                ->where('on_hand', '>', 0)
                ->whereNotNull('expiry_date')
                ->whereDate('expiry_date', '<', $today)
                ->count();

            $nearExpiry = (int) (clone $stockQuery)
                ->where('on_hand', '>', 0)
                ->whereNotNull('expiry_date')
                ->whereDate('expiry_date', '>=', $today)
                ->whereDate('expiry_date', '<=', $horizon)
                ->count();
        }

        $putawayPending = 0;
        if ($stockQuery !== null && $hasLocations) {
            $putawayPending = (int) (clone $stockQuery)
                ->where('on_hand', '>', 0)
                ->whereHas('location', fn (Builder $query) => $query->whereIn('type', ['input', 'quality_control']))
                ->count();
        }

        $opnamesOpen = 0;
        if ($hasOpnames) {
            $opnamesOpen = (int) StockOpname::query()
                ->whereIn('status', ['draft', 'in_progress'])
                ->when(
                    $warehouseIds !== null,
                    fn (Builder $query) => $warehouseIds === []
                        ? $query->whereRaw('0 = 1')
                        : $query->whereIn('warehouse_id', $warehouseIds)
                )
                ->count();
        }

        $movementsToday = 0;
        $recent = [];
        if ($hasMovements) {
            $movementQuery = StockMovement::query()
                ->when(
                    $warehouseIds !== null,
                    fn (Builder $query) => $warehouseIds === []
                        ? $query->whereRaw('0 = 1')
                        : $query->whereIn('warehouse_id', $warehouseIds)
                );

            $movementsToday = (int) (clone $movementQuery)
                ->whereDate('recorded_at', $today)
                ->count();

            $recent = (clone $movementQuery)
                ->with([
                    'product:id,name,code',
                    'warehouse:id,name',
                ])
                ->latest('recorded_at')
                ->limit($recentLimit)
                ->get()
                ->map(fn (StockMovement $movement): array => [
                    'id' => $movement->id,
                    'type' => $movement->type,
                    'quantity' => (float) $movement->quantity,
                    'reference_code' => $movement->reference_code,
                    'product' => $movement->product
                        ? [
                            'id' => $movement->product->id,
                            'name' => $movement->product->name,
                            'code' => $movement->product->code,
                        ]
                        : null,
                    'warehouse' => $movement->warehouse
                        ? [
                            'id' => $movement->warehouse->id,
                            'name' => $movement->warehouse->name,
                        ]
                        : null,
                    'recorded_at' => $movement->recorded_at?->toIso8601String(),
                ])
                ->all();
        }

        $sites = AccessibleWarehouses::query()
            ->withCount([
                'stockLevels as stock_lines' => fn (Builder $query) => $query->where('on_hand', '>', 0),
            ])
            ->orderBy('name')
            ->limit(6)
            ->get(['id', 'name', 'kind', 'status', 'location'])
            ->map(fn (Warehouse $warehouse): array => [
                'id' => $warehouse->id,
                'name' => $warehouse->name,
                'kind' => $warehouse->kind instanceof WarehouseKind
                    ? $warehouse->kind->value
                    : (string) ($warehouse->kind ?? 'warehouse'),
                'status' => $warehouse->status,
                'location' => $warehouse->location,
                'stock_lines' => (int) $warehouse->stock_lines,
            ])
            ->all();

        $attention = $lowStock + $expired + $nearExpiry + $putawayPending + $opnamesOpen;

        return [
            'warehouses' => [
                'total' => $warehousesTotal,
                'active' => $warehousesActive,
                'inactive' => $warehousesInactive,
                'warehouse' => (int) ($warehousesByKind['warehouse'] ?? 0),
                'store' => (int) ($warehousesByKind['store'] ?? 0),
                'showroom' => (int) ($warehousesByKind['showroom'] ?? 0),
            ],
            'stock' => [
                'lines' => $lines,
                'on_hand' => round($onHand, 2),
                'reserved' => round($reserved, 2),
                'available' => $available,
                'low_stock' => $lowStock,
            ],
            'alerts' => [
                'expired' => $expired,
                'near_expiry' => $nearExpiry,
                'expiry_horizon_days' => self::EXPIRY_HORIZON_DAYS,
                'putaway_pending' => $putawayPending,
                'opnames_open' => $opnamesOpen,
                'attention' => $attention,
            ],
            'activity' => [
                'movements_today' => $movementsToday,
            ],
            'sites' => $sites,
            'recent' => $recent,
        ];
    }

    /**
     * @param  list<int>|null  $warehouseIds
     * @return Builder<StockLevel>|null
     */
    private function scopedStockLevels(?array $warehouseIds): ?Builder
    {
        if (! Schema::hasTable('stock_levels')) {
            return null;
        }

        return StockLevel::query()
            ->when(
                $warehouseIds !== null,
                fn (Builder $query) => $warehouseIds === []
                    ? $query->whereRaw('0 = 1')
                    : $query->whereIn('warehouse_id', $warehouseIds)
            );
    }
}
