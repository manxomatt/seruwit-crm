<?php

namespace Modules\Product\Support;

use Modules\Product\Models\Brand;
use Modules\Product\Models\Principal;
use Modules\Product\Models\Product;
use Modules\Product\Models\ProductAttribute;
use Modules\Product\Models\ProductTag;
use Modules\Product\Models\ProductType;

/**
 * Product catalog overview: status mix, category split, and master-data readiness.
 */
class ProductStatusBoard
{
    /**
     * @return array<string, mixed>
     */
    public function build(int $recentLimit = 10): array
    {
        $byStatus = Product::query()
            ->selectRaw('status, count(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status');

        $byCategory = Product::query()
            ->selectRaw("coalesce(category, 'merchandise') as category, count(*) as total")
            ->groupByRaw("coalesce(category, 'merchandise')")
            ->pluck('total', 'category');

        $total = (int) $byStatus->sum();
        $favorites = (int) Product::query()->where('is_favorite', true)->count();
        $variants = (int) Product::query()->whereNotNull('parent_id')->count();
        $withoutBrand = (int) Product::query()->whereNull('brand_id')->count();
        $withoutPrice = (int) Product::query()
            ->where(function ($query): void {
                $query->whereNull('price')->orWhere('price', 0);
            })
            ->count();

        $brandsTotal = (int) Brand::query()->count();
        $brandsActive = (int) Brand::query()->where('status', 'active')->count();
        $principalsTotal = (int) Principal::query()->count();
        $principalsActive = (int) Principal::query()->where('status', 'active')->count();
        $productTypes = (int) ProductType::query()->count();
        $tags = (int) ProductTag::query()->count();
        $attributes = (int) ProductAttribute::query()->count();

        $recent = Product::query()
            ->with(['brand:id,name', 'productType:id,name'])
            ->latest()
            ->limit($recentLimit)
            ->get(['id', 'code', 'sku', 'name', 'status', 'category', 'price', 'brand_id', 'product_type_id', 'created_at'])
            ->map(fn (Product $product): array => [
                'id' => $product->id,
                'code' => $product->code,
                'sku' => $product->sku,
                'name' => $product->name,
                'status' => $product->status,
                'category' => $product->category ?? 'merchandise',
                'price' => $product->price !== null ? (float) $product->price : null,
                'brand' => $product->brand?->name,
                'product_type' => $product->productType?->name,
                'created_at' => $product->created_at?->toDateString(),
            ])
            ->all();

        $topBrands = Product::query()
            ->join('brands', 'products.brand_id', '=', 'brands.id')
            ->selectRaw('brands.id, brands.name, count(*) as total')
            ->groupBy('brands.id', 'brands.name')
            ->orderByDesc('total')
            ->limit(5)
            ->get()
            ->map(fn ($row): array => [
                'id' => (int) $row->id,
                'name' => (string) $row->name,
                'total' => (int) $row->total,
            ])
            ->all();

        return [
            'counts' => [
                'total' => $total,
                'active' => (int) ($byStatus['active'] ?? 0),
                'inactive' => (int) ($byStatus['inactive'] ?? 0),
                'favorites' => $favorites,
                'variants' => $variants,
                'without_brand' => $withoutBrand,
                'without_price' => $withoutPrice,
            ],
            'categories' => [
                'merchandise' => (int) ($byCategory['merchandise'] ?? 0),
                'fleet_sparepart' => (int) ($byCategory['fleet_sparepart'] ?? 0),
                'service' => (int) ($byCategory['service'] ?? 0),
            ],
            'masters' => [
                'brands_active' => $brandsActive,
                'brands_total' => $brandsTotal,
                'principals_active' => $principalsActive,
                'principals_total' => $principalsTotal,
                'product_types' => $productTypes,
                'tags' => $tags,
                'attributes' => $attributes,
            ],
            'recent' => $recent,
            'top_brands' => $topBrands,
        ];
    }
}
