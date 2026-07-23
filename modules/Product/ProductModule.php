<?php

namespace Modules\Product;

use App\Modules\ModuleContract;
use App\Modules\ModuleTier;
use Illuminate\Support\Facades\Route;
use Modules\Product\Http\Controllers\BrandController;
use Modules\Product\Http\Controllers\PrincipalController;
use Modules\Product\Http\Controllers\ProductAttributeController;
use Modules\Product\Http\Controllers\ProductController;
use Modules\Product\Http\Controllers\ProductTagController;
use Modules\Product\Http\Controllers\ProductTypeController;

/**
 * Product catalog, deliberately free of any stock/quantity-on-hand concept.
 * Any module that needs to reference a product — currently Transportation
 * for its cargo manifest, eventually an Inventory or sales module —
 * declares `requires(): ['products']` rather than owning its own copy.
 */
class ProductModule implements ModuleContract
{
    public function key(): string
    {
        return 'products';
    }

    public function label(): string
    {
        return 'Products';
    }

    public function description(): string
    {
        return 'Product catalog shared by every module that needs it.';
    }

    public function tier(): ModuleTier
    {
        return ModuleTier::Foundation;
    }

    public function permissions(): array
    {
        return ['view', 'create', 'update', 'delete'];
    }

    /**
     * Fully standalone — no photo field, so no Media dependency either.
     */
    public function requires(): array
    {
        return [];
    }

    public function menu(): ?array
    {
        return [
            'name' => 'Products',
            'slug' => 'products',
            'icon' => 'products',
            'route_name' => 'products.index',
            'permission_module' => 'products',
            'permission_action' => 'view',
            'sort_order' => 8,
        ];
    }

    public function migrationsPath(): string
    {
        return __DIR__.'/Database/Migrations';
    }

    public function viewsPath(): ?string
    {
        return null;
    }

    /**
     * Pure configuration only — no tenant is initialized yet at boot.
     */
    public function boot(): void
    {
        //
    }

    public function routes(): void
    {
        // Principals (before {product} wildcard)
        Route::get('/products/principals', [PrincipalController::class, 'index'])->middleware('permission:products,view')->name('products.principals.index');
        Route::get('/products/principals/create', [PrincipalController::class, 'create'])->middleware('permission:products,create')->name('products.principals.create');
        Route::post('/products/principals', [PrincipalController::class, 'store'])->middleware('permission:products,create')->name('products.principals.store');
        Route::get('/products/principals/{principal}/edit', [PrincipalController::class, 'edit'])->middleware('permission:products,update')->name('products.principals.edit');
        Route::patch('/products/principals/{principal}', [PrincipalController::class, 'update'])->middleware('permission:products,update')->name('products.principals.update');
        Route::delete('/products/principals/{principal}', [PrincipalController::class, 'destroy'])->middleware('permission:products,delete')->name('products.principals.destroy');

        // Brands (before {product} wildcard)
        Route::get('/products/brands', [BrandController::class, 'index'])->middleware('permission:products,view')->name('products.brands.index');
        Route::get('/products/brands/create', [BrandController::class, 'create'])->middleware('permission:products,create')->name('products.brands.create');
        Route::post('/products/brands', [BrandController::class, 'store'])->middleware('permission:products,create')->name('products.brands.store');
        Route::get('/products/brands/{brand}/edit', [BrandController::class, 'edit'])->middleware('permission:products,update')->name('products.brands.edit');
        Route::patch('/products/brands/{brand}', [BrandController::class, 'update'])->middleware('permission:products,update')->name('products.brands.update');
        Route::delete('/products/brands/{brand}', [BrandController::class, 'destroy'])->middleware('permission:products,delete')->name('products.brands.destroy');

        // Product Types (before {product} wildcard)
        Route::get('/products/product-types', [ProductTypeController::class, 'index'])->middleware('permission:products,view')->name('products.product-types.index');
        Route::get('/products/product-types/create', [ProductTypeController::class, 'create'])->middleware('permission:products,create')->name('products.product-types.create');
        Route::post('/products/product-types', [ProductTypeController::class, 'store'])->middleware('permission:products,create')->name('products.product-types.store');
        Route::get('/products/product-types/{productType}/edit', [ProductTypeController::class, 'edit'])->middleware('permission:products,update')->name('products.product-types.edit');
        Route::patch('/products/product-types/{productType}', [ProductTypeController::class, 'update'])->middleware('permission:products,update')->name('products.product-types.update');
        Route::delete('/products/product-types/{productType}', [ProductTypeController::class, 'destroy'])->middleware('permission:products,delete')->name('products.product-types.destroy');

        // Attributes (before {product} wildcard)
        Route::get('/products/attributes', [ProductAttributeController::class, 'index'])->middleware('permission:products,view')->name('products.attributes.index');
        Route::get('/products/attributes/create', [ProductAttributeController::class, 'create'])->middleware('permission:products,create')->name('products.attributes.create');
        Route::post('/products/attributes', [ProductAttributeController::class, 'store'])->middleware('permission:products,create')->name('products.attributes.store');
        Route::get('/products/attributes/{attribute}/edit', [ProductAttributeController::class, 'edit'])->middleware('permission:products,update')->name('products.attributes.edit');
        Route::patch('/products/attributes/{attribute}', [ProductAttributeController::class, 'update'])->middleware('permission:products,update')->name('products.attributes.update');
        Route::delete('/products/attributes/{attribute}', [ProductAttributeController::class, 'destroy'])->middleware('permission:products,delete')->name('products.attributes.destroy');

        // Tags (before {product} wildcard)
        Route::get('/products/tags', [ProductTagController::class, 'index'])->middleware('permission:products,view')->name('products.tags.index');
        Route::get('/products/tags/create', [ProductTagController::class, 'create'])->middleware('permission:products,create')->name('products.tags.create');
        Route::post('/products/tags', [ProductTagController::class, 'store'])->middleware('permission:products,create')->name('products.tags.store');
        Route::get('/products/tags/{tag}/edit', [ProductTagController::class, 'edit'])->middleware('permission:products,update')->name('products.tags.edit');
        Route::patch('/products/tags/{tag}', [ProductTagController::class, 'update'])->middleware('permission:products,update')->name('products.tags.update');
        Route::delete('/products/tags/{tag}', [ProductTagController::class, 'destroy'])->middleware('permission:products,delete')->name('products.tags.destroy');

        // Products
        Route::get('/products', [ProductController::class, 'index'])->middleware('permission:products,view')->name('products.index');
        Route::get('/products/create', [ProductController::class, 'create'])->middleware('permission:products,create')->name('products.create');
        Route::post('/products', [ProductController::class, 'store'])->middleware('permission:products,create')->name('products.store');
        Route::get('/products/{product}', [ProductController::class, 'show'])->middleware('permission:products,view')->name('products.show');
        Route::get('/products/{product}/edit', [ProductController::class, 'edit'])->middleware('permission:products,update')->name('products.edit');
        Route::patch('/products/{product}', [ProductController::class, 'update'])->middleware('permission:products,update')->name('products.update');
        Route::delete('/products/{product}', [ProductController::class, 'destroy'])->middleware('permission:products,delete')->name('products.destroy');
    }
}
