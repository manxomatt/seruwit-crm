<?php

namespace Modules\Product\Support;

use Illuminate\Support\Facades\Schema;
use Modules\Product\Models\Brand;
use Modules\Product\Models\Principal;
use Modules\Product\Models\Product;
use Modules\Product\Models\ProductAttribute;
use Modules\Product\Models\ProductTag;
use Modules\Product\Models\ProductType;

/**
 * Product catalog overview: status mix, category split, and master-data readiness.
 *
 * Optional columns (category from Inventory, favorites/variants from later Product
 * migrations) are detected at runtime so tenants with a lean products table still load.
 */
class ProductStatusBoard
{
    /**
     * @return array<string, mixed>
     */
    public function build(int $recentLimit = 10): array
    {
        $hasCategory = Schema::hasColumn('products', 'category');
        $hasFavorite = Schema::hasColumn('products', 'is_favorite');
        $hasParent = Schema::hasColumn('products', 'parent_id');
        $hasBrand = Schema::hasColumn('products', 'brand_id');
        $hasSku = Schema::hasColumn('products', 'sku');
        $hasProductType = Schema::hasColumn('products', 'product_type_id');
        $hasBrandsTable = Schema::hasTable('brands');
        $hasPrincipalsTable = Schema::hasTable('principals');
        $hasProductTypesTable = Schema::hasTable('product_types');
        $hasTagsTable = Schema::hasTable('product_tags');
        $hasAttributesTable = Schema::hasTable('product_attributes');

        $byStatus = Product::query()
            ->selectRaw('status, count(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status');

        $byCategory = collect();
        if ($hasCategory) {
            $byCategory = Product::query()
                ->selectRaw("coalesce(category, 'merchandise') as category, count(*) as total")
                ->groupByRaw("coalesce(category, 'merchandise')")
                ->pluck('total', 'category');
        }

        $total = (int) $byStatus->sum();
        $favorites = $hasFavorite
            ? (int) Product::query()->where('is_favorite', true)->count()
            : 0;
        $variants = $hasParent
            ? (int) Product::query()->whereNotNull('parent_id')->count()
            : 0;
        $withoutBrand = $hasBrand
            ? (int) Product::query()->whereNull('brand_id')->count()
            : 0;
        $withoutPrice = (int) Product::query()
            ->where(function ($query): void {
                $query->whereNull('price')->orWhere('price', 0);
            })
            ->count();

        $brandsTotal = $hasBrandsTable ? (int) Brand::query()->count() : 0;
        $brandsActive = $hasBrandsTable ? (int) Brand::query()->where('status', 'active')->count() : 0;
        $principalsTotal = $hasPrincipalsTable ? (int) Principal::query()->count() : 0;
        $principalsActive = $hasPrincipalsTable ? (int) Principal::query()->where('status', 'active')->count() : 0;
        $productTypes = $hasProductTypesTable ? (int) ProductType::query()->count() : 0;
        $tags = $hasTagsTable ? (int) ProductTag::query()->count() : 0;
        $attributes = $hasAttributesTable ? (int) ProductAttribute::query()->count() : 0;

        $recentColumns = ['id', 'code', 'name', 'status', 'price', 'created_at'];
        if ($hasSku) {
            $recentColumns[] = 'sku';
        }
        if ($hasCategory) {
            $recentColumns[] = 'category';
        }
        if ($hasBrand) {
            $recentColumns[] = 'brand_id';
        }
        if ($hasProductType) {
            $recentColumns[] = 'product_type_id';
        }

        $recentQuery = Product::query()->latest()->limit($recentLimit);
        if ($hasBrand && $hasBrandsTable) {
            $recentQuery->with('brand:id,name');
        }
        if ($hasProductType && $hasProductTypesTable) {
            $recentQuery->with('productType:id,name');
        }

        $recent = $recentQuery
            ->get($recentColumns)
            ->map(fn (Product $product): array => [
                'id' => $product->id,
                'code' => $product->code,
                'sku' => $hasSku ? $product->sku : null,
                'name' => $product->name,
                'status' => $product->status,
                'category' => $hasCategory ? ($product->category ?? 'merchandise') : null,
                'price' => $product->price !== null ? (float) $product->price : null,
                'brand' => ($hasBrand && $hasBrandsTable) ? $product->brand?->name : null,
                'product_type' => ($hasProductType && $hasProductTypesTable) ? $product->productType?->name : null,
                'created_at' => $product->created_at?->toDateString(),
            ])
            ->all();

        $topBrands = [];
        if ($hasBrand && $hasBrandsTable) {
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
        }

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
                'available' => $hasCategory,
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
