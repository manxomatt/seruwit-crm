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
            ->select('id', 'name', 'category', 'stock_unit', 'reorder_threshold', 'tracking')
            ->orderBy('name')
            ->get();

        $stockLevels = StockLevel::query()
            ->with('location:id,name,code')
            ->select('product_id', 'warehouse_id', 'location_id', 'batch_number', 'expiry_date', 'on_hand', 'reserved')
            ->get()
            ->groupBy(fn ($level) => "{$level->product_id}-{$level->warehouse_id}");

        $matrix = $products->map(function ($product) use ($warehouses, $stockLevels) {
            return [
                'product' => [
                    'id' => $product->id,
                    'name' => $product->name,
                    'category' => $product->category,
                    'stock_unit' => $product->stock_unit,
                    'reorder_threshold' => $product->reorder_threshold,
                    'tracking' => $product->tracking,
                ],
                'levels' => $warehouses->map(function ($warehouse) use ($product, $stockLevels) {
                    $key = "{$product->id}-{$warehouse->id}";
                    $group = $stockLevels[$key] ?? collect();
                    $onHand = $group->sum('on_hand');
                    $reserved = $group->sum('reserved');

                    return [
                        'warehouse_id' => $warehouse->id,
                        'on_hand' => $onHand,
                        'reserved' => $reserved,
                        'available' => $onHand - $reserved,
                        'is_low_stock' => ($onHand - $reserved) <= ($product->reorder_threshold ?? 10),
                        'batches' => $group
                            ->filter(fn ($l) => (float) $l->on_hand > 0)
                            ->sortBy(fn ($l) => $l->expiry_date?->toDateString() ?? '9999-99-99')
                            ->values()
                            ->map(fn ($l) => [
                                'batch_number' => $l->batch_number !== '' ? $l->batch_number : null,
                                'expiry_date' => $l->expiry_date?->toDateString(),
                                'location' => $l->location?->only('id', 'name', 'code'),
                                'on_hand' => $l->on_hand,
                                'reserved' => $l->reserved,
                            ]),
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
