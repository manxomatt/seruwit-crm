<?php

namespace Modules\Product;

use App\Modules\ModuleContract;
use Illuminate\Support\Facades\Route;
use Modules\Product\Http\Controllers\ProductController;

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
        Route::get('/products', [ProductController::class, 'index'])->middleware('permission:products,view')->name('products.index');
        Route::get('/products/create', [ProductController::class, 'create'])->middleware('permission:products,create')->name('products.create');
        Route::post('/products', [ProductController::class, 'store'])->middleware('permission:products,create')->name('products.store');
        Route::get('/products/{product}', [ProductController::class, 'show'])->middleware('permission:products,view')->name('products.show');
        Route::get('/products/{product}/edit', [ProductController::class, 'edit'])->middleware('permission:products,update')->name('products.edit');
        Route::patch('/products/{product}', [ProductController::class, 'update'])->middleware('permission:products,update')->name('products.update');
        Route::delete('/products/{product}', [ProductController::class, 'destroy'])->middleware('permission:products,delete')->name('products.destroy');
    }
}
