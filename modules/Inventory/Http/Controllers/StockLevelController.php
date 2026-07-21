<?php

namespace Modules\Inventory\Http\Controllers;

use App\Http\Controllers\Controller;
use Modules\Inventory\Models\StockLevel;
use Modules\Inventory\Models\Warehouse;
use Modules\Product\Models\Product;

class StockLevelController extends Controller
{
    public function getRoutePrefix(): string
    {
        return 'module';
    }

    public function index()
    {
        $warehouses = Warehouse::query()
            ->where('status', 'active')
            ->select('id', 'name')
            ->orderBy('name')
            ->get();

        $products = Product::query()
            ->select('id', 'name', 'category', 'stock_unit', 'reorder_threshold')
            ->orderBy('name')
            ->get();

        $stockLevels = StockLevel::query()
            ->select('product_id', 'warehouse_id', 'on_hand', 'reserved')
            ->get()
            ->keyBy(fn ($level) => "{$level->product_id}-{$level->warehouse_id}");

        // Build matrix: rows are products, columns are warehouses
        $matrix = $products->map(function ($product) use ($warehouses, $stockLevels) {
            return [
                'product' => [
                    'id' => $product->id,
                    'name' => $product->name,
                    'category' => $product->category,
                    'stock_unit' => $product->stock_unit,
                    'reorder_threshold' => $product->reorder_threshold,
                ],
                'levels' => $warehouses->map(function ($warehouse) use ($product, $stockLevels) {
                    $key = "{$product->id}-{$warehouse->id}";
                    $level = $stockLevels[$key] ?? null;

                    return [
                        'warehouse_id' => $warehouse->id,
                        'on_hand' => $level?->on_hand ?? 0,
                        'reserved' => $level?->reserved ?? 0,
                        'available' => ($level?->on_hand ?? 0) - ($level?->reserved ?? 0),
                        'is_low_stock' => $level?->isLowStock() ?? false,
                    ];
                }),
            ];
        });

        return inertia('Modules/Inventory/StockLevels/Index', [
            'warehouses' => $warehouses,
            'matrix' => $matrix,
        ]);
    }
}
