<?php

namespace Modules\Carousels;

use App\Models\User;
use App\Modules\ModuleContract;
use App\Modules\ModuleTier;
use Illuminate\Support\Facades\Blade;
use Illuminate\Support\Facades\Route;
use Modules\Carousels\Http\Controllers\CarouselController;
use Modules\Carousels\Http\Controllers\CarouselImageController;
use Modules\Carousels\Models\Carousel;
use Modules\Carousels\View\Components\Carousel as CarouselComponent;

class CarouselsModule implements ModuleContract
{
    public function key(): string
    {
        return 'carousels';
    }

    public function label(): string
    {
        return 'Carousels';
    }

    public function description(): string
    {
        return 'Image sliders for the public site, with ordering and captions.';
    }

    public function tier(): ModuleTier
    {
        return ModuleTier::Content;
    }

    public function permissions(): array
    {
        return ['view', 'create', 'update', 'delete'];
    }

    /**
     * The image picker in the editor reads from the Media library, so Carousels
     * cannot stand on its own without it.
     */
    public function requires(): array
    {
        return ['media'];
    }

    public function menu(): ?array
    {
        return [
            'name' => 'Carousels',
            'slug' => 'carousels',
            'icon' => 'carousels',
            'route_name' => 'carousels.index',
            'permission_module' => 'carousels',
            'permission_action' => 'view',
            'sort_order' => 4,
        ];
    }

    public function migrationsPath(): string
    {
        return __DIR__.'/Database/Migrations';
    }

    public function viewsPath(): string
    {
        return __DIR__.'/resources/views';
    }

    /**
     * Attaches the module's relation to the core User model, so that App\Models\User
     * needs no knowledge of Carousels. Callers must still gate on
     * Modules::available('carousels') — the relation is registered for every
     * process, but the table only exists where the module is installed.
     */
    public function boot(): void
    {
        User::resolveRelationUsing('carousels', fn (User $user) => $user->hasMany(Carousel::class));

        // Blade only auto-discovers components under App\View\Components, so
        // <x-carousel> has to be registered by hand from here.
        Blade::component('carousel', CarouselComponent::class);
    }

    public function routes(): void
    {
        Route::get('/carousels', [CarouselController::class, 'index'])->middleware('permission:carousels,view')->name('carousels.index');
        Route::get('/carousels/create', [CarouselController::class, 'create'])->middleware('permission:carousels,create')->name('carousels.create');
        Route::post('/carousels', [CarouselController::class, 'store'])->middleware('permission:carousels,create')->name('carousels.store');
        Route::get('/carousels/{carousel}', [CarouselController::class, 'show'])->middleware('permission:carousels,view')->name('carousels.show');
        Route::get('/carousels/{carousel}/edit', [CarouselController::class, 'edit'])->middleware('permission:carousels,update')->name('carousels.edit');
        Route::patch('/carousels/{carousel}', [CarouselController::class, 'update'])->middleware('permission:carousels,update')->name('carousels.update');
        Route::delete('/carousels/{carousel}', [CarouselController::class, 'destroy'])->middleware('permission:carousels,delete')->name('carousels.destroy');
        Route::post('/carousels/{carousel}/images', [CarouselImageController::class, 'store'])->middleware('permission:carousels,create')->name('carousels.images.store');
        Route::patch('/carousels/{carousel}/images/{image}', [CarouselImageController::class, 'update'])->middleware('permission:carousels,update')->name('carousels.images.update');
        Route::delete('/carousels/{carousel}/images/{image}', [CarouselImageController::class, 'destroy'])->middleware('permission:carousels,delete')->name('carousels.images.destroy');
        Route::post('/carousels/{carousel}/images/reorder', [CarouselImageController::class, 'reorder'])->middleware('permission:carousels,update')->name('carousels.images.reorder');
    }
}
