<?php

namespace Modules\Pages;

use App\Models\User;
use App\Modules\ModuleContract;
use Illuminate\Support\Facades\Route;
use Modules\Pages\Http\Controllers\PageController;
use Modules\Pages\Models\Page;

/**
 * The GrapesJS page builder: visually edited pages published on the tenant's
 * own public site. The public render routes (/ and /p/{slug}) stay in core —
 * they exist whether or not this module is installed — and gate themselves on
 * Modules::available('pages').
 */
class PagesModule implements ModuleContract
{
    public function key(): string
    {
        return 'pages';
    }

    public function label(): string
    {
        return 'Pages';
    }

    public function description(): string
    {
        return 'Visual page builder for the public site, with a drag-and-drop editor.';
    }

    public function permissions(): array
    {
        return ['view', 'create', 'update', 'delete'];
    }

    /**
     * The editor's asset manager reads from the Media library, so Pages cannot
     * stand on its own without it.
     */
    public function requires(): array
    {
        return ['media'];
    }

    public function menu(): ?array
    {
        return [
            'name' => 'Pages',
            'slug' => 'pages',
            'icon' => 'pages',
            'route_name' => 'pages.index',
            'permission_module' => 'pages',
            'permission_action' => 'view',
            'sort_order' => 2,
        ];
    }

    public function migrationsPath(): string
    {
        return __DIR__.'/Database/Migrations';
    }

    /**
     * Holds the public page renderer (pages::render), used by the core
     * homepage and /p/{slug} routes when the module is available.
     */
    public function viewsPath(): string
    {
        return __DIR__.'/resources/views';
    }

    /**
     * Attaches the module's relation to the core User model, so that
     * App\Models\User needs no knowledge of Pages. Callers must still gate on
     * Modules::available('pages') — the relation is registered for every
     * process, but the table only exists where the module is installed.
     */
    public function boot(): void
    {
        User::resolveRelationUsing('pages', fn (User $user) => $user->hasMany(Page::class));
    }

    public function routes(): void
    {
        Route::get('/pages', [PageController::class, 'index'])->middleware('permission:pages,view')->name('pages.index');
        Route::get('/pages/create', [PageController::class, 'create'])->middleware('permission:pages,create')->name('pages.create');
        Route::post('/pages', [PageController::class, 'store'])->middleware('permission:pages,create')->name('pages.store');
        Route::get('/pages/{page}', [PageController::class, 'show'])->middleware('permission:pages,view')->name('pages.show');
        Route::get('/pages/{page}/edit', [PageController::class, 'edit'])->middleware('permission:pages,update')->name('pages.edit');
        Route::patch('/pages/{page}', [PageController::class, 'update'])->middleware('permission:pages,update')->name('pages.update');
        Route::patch('/pages/{page}/save-content', [PageController::class, 'saveContent'])->middleware('permission:pages,update')->name('pages.save-content');
        Route::patch('/pages/{page}/set-homepage', [PageController::class, 'setHomepage'])->middleware('permission:pages,update')->name('pages.set-homepage');
        Route::delete('/pages/{page}', [PageController::class, 'destroy'])->middleware('permission:pages,delete')->name('pages.destroy');
    }
}
