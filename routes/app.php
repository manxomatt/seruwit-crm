<?php

use App\Http\Controllers\BlogController;
use App\Http\Controllers\LiveUpdateController;
use App\Http\Controllers\Module\AnalyticsController as ModuleAnalyticsController;
use App\Http\Controllers\Module\DashboardController as ModuleDashboardController;
use App\Http\Controllers\Module\GlobalSearchController as ModuleGlobalSearchController;
use App\Http\Controllers\Module\MediaController as ModuleMediaController;
use App\Http\Controllers\Module\ModuleController as ModuleCatalogController;
use App\Http\Controllers\Module\RoleController as ModuleRoleController;
use App\Http\Controllers\Module\SettingController as ModuleSettingController;
use App\Http\Controllers\Module\UserController as ModuleUserController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\PageController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\TodoController;
use App\Modules\Facades\Modules;
use Illuminate\Support\Facades\Route;
use Modules\Orders\Http\Controllers\PublicTrackingController;

/*
|--------------------------------------------------------------------------
| Application Routes
|--------------------------------------------------------------------------
|
| The CRM application itself. This file is included by both routes/web.php
| (central domain, transitional) and routes/tenant.php (tenant domains), so
| it must not reference any domain- or tenancy-specific configuration.
|
*/

Route::get('/', [PageController::class, 'homepage'])->name('home');

// Public Blog Routes
Route::get('/blog', [BlogController::class, 'index'])->name('blog.index');
Route::get('/blog/{slug}', [BlogController::class, 'show'])->name('blog.show');

// Public shipment tracking — no auth, tenant resolved by domain. The Orders
// controller 404s when the module is not installed, like the blog does.
Route::get('/track/{token}', [PublicTrackingController::class, 'show'])->name('track.show');

Route::get('/dashboard', [ModuleDashboardController::class, 'index'])
    ->middleware(['auth', 'verified'])
    ->name('dashboard');

Route::middleware('auth')->group(function () {
    // Module Routes
    Route::prefix('module')->name('module.')->group(function () {
        Route::get('/dashboard', [ModuleDashboardController::class, 'index'])->name('dashboard');

        // Global Search
        Route::get('/search', [ModuleGlobalSearchController::class, 'search'])->name('search');

        // Notifications — every authenticated user reads their own, no gate.
        Route::get('/notifications', [NotificationController::class, 'index'])->name('notifications.index');
        Route::post('/notifications/read-all', [NotificationController::class, 'markAllAsRead'])->name('notifications.read-all');
        Route::post('/notifications/{notification}/read', [NotificationController::class, 'markAsRead'])->name('notifications.read');

        // Pages and Posts route from their modules now (see Modules::registerRoutes()
        // below), same as every other extracted module.

        // Module Media Routes
        Route::get('/media', [ModuleMediaController::class, 'index'])->middleware('permission:media,view')->name('media.index');
        Route::get('/media/create', [ModuleMediaController::class, 'create'])->middleware('permission:media,create')->name('media.create');
        Route::post('/media', [ModuleMediaController::class, 'store'])->middleware('permission:media,create')->name('media.store');
        Route::post('/media/upload', [ModuleMediaController::class, 'upload'])->middleware('permission:media,create')->name('media.upload');
        Route::get('/media/picker', [ModuleMediaController::class, 'picker'])->middleware('permission:media,view')->name('media.picker');
        Route::post('/media/bulk-destroy', [ModuleMediaController::class, 'bulkDestroy'])->middleware('permission:media,delete')->name('media.bulk-destroy');
        Route::get('/media/{medium}', [ModuleMediaController::class, 'show'])->middleware('permission:media,view')->name('media.show');
        Route::get('/media/{medium}/edit', [ModuleMediaController::class, 'edit'])->middleware('permission:media,update')->name('media.edit');
        Route::patch('/media/{medium}', [ModuleMediaController::class, 'update'])->middleware('permission:media,update')->name('media.update');
        Route::delete('/media/{medium}', [ModuleMediaController::class, 'destroy'])->middleware('permission:media,delete')->name('media.destroy');

        // Module Analytics Routes
        Route::get('/analytics', [ModuleAnalyticsController::class, 'index'])->middleware('permission:analytics,view')->name('analytics.index');

        // Module Settings Routes — a tenant may view and edit the *values* of
        // its own settings (e.g. its own social media links), but defining,
        // renaming, or deleting a setting is a central-only capability (see
        // routes/web.php).
        Route::get('/settings', [ModuleSettingController::class, 'index'])->middleware('permission:settings,view')->name('settings.index');
        Route::get('/settings/{group}', [ModuleSettingController::class, 'group'])->middleware('permission:settings,view')->name('settings.group');
        Route::post('/settings/bulk-update', [ModuleSettingController::class, 'bulkUpdate'])->middleware('permission:settings,update')->name('settings.bulk-update');

        // Module User Management Routes
        Route::post('/users/invite', [\App\Http\Controllers\Module\UserInvitationController::class, 'store'])->middleware('permission:users,create')->name('users.invite');
        Route::get('/users', [ModuleUserController::class, 'index'])->middleware('permission:users,view')->name('users.index');
        Route::get('/users/create', [ModuleUserController::class, 'create'])->middleware('permission:users,create')->name('users.create');
        Route::post('/users', [ModuleUserController::class, 'store'])->middleware('permission:users,create')->name('users.store');
        Route::get('/users/{user}', [ModuleUserController::class, 'show'])->middleware('permission:users,view')->name('users.show');
        Route::get('/users/{user}/edit', [ModuleUserController::class, 'edit'])->middleware('permission:users,update')->name('users.edit');
        Route::patch('/users/{user}', [ModuleUserController::class, 'update'])->middleware('permission:users,update')->name('users.update');
        Route::delete('/users/{user}', [ModuleUserController::class, 'destroy'])->middleware('permission:users,delete')->name('users.destroy');

        // Module Role Management Routes
        Route::get('/roles', [ModuleRoleController::class, 'index'])->middleware('permission:roles,view')->name('roles.index');
        Route::get('/roles/create', [ModuleRoleController::class, 'create'])->middleware('permission:roles,create')->name('roles.create');
        Route::post('/roles', [ModuleRoleController::class, 'store'])->middleware('permission:roles,create')->name('roles.store');
        Route::get('/roles/{role}', [ModuleRoleController::class, 'show'])->middleware('permission:roles,view')->name('roles.show');
        Route::get('/roles/{role}/edit', [ModuleRoleController::class, 'edit'])->middleware('permission:roles,update')->name('roles.edit');
        Route::patch('/roles/{role}', [ModuleRoleController::class, 'update'])->middleware('permission:roles,update')->name('roles.update');
        Route::delete('/roles/{role}', [ModuleRoleController::class, 'destroy'])->middleware('permission:roles,delete')->name('roles.destroy');

        // The workspace's own module catalog. Tenant-domain only, which the
        // controller enforces — this file is shared with the central domain.
        Route::get('/modules', [ModuleCatalogController::class, 'index'])->name('modules.index');
        Route::post('/modules/{module}/install', [ModuleCatalogController::class, 'install'])->name('modules.install');
        Route::delete('/modules/{module}', [ModuleCatalogController::class, 'uninstall'])->name('modules.uninstall');

        // Routes contributed by installed-per-tenant modules. Registered
        // unconditionally: enforcement is the requires-module middleware's job,
        // since conditional registration would bake one tenant's install state
        // into route:cache and break route() for everyone else.
        Modules::registerRoutes();
    });

    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::post('/profile/avatar', [ProfileController::class, 'updateAvatar'])->name('profile.avatar.update');
    Route::delete('/profile/avatar', [ProfileController::class, 'destroyAvatar'])->name('profile.avatar.destroy');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    Route::get('/todos', [TodoController::class, 'index'])->name('todos.index');
    Route::post('/todos', [TodoController::class, 'store'])->name('todos.store');
    Route::patch('/todos/{todo}', [TodoController::class, 'update'])->name('todos.update');
    Route::delete('/todos/{todo}', [TodoController::class, 'destroy'])->name('todos.destroy');

    Route::get('/live-updates', [LiveUpdateController::class, 'index'])->middleware('permission:live-updates,view')->name('live-updates.index');
    Route::get('/live-updates/create', [LiveUpdateController::class, 'create'])->middleware('permission:live-updates,create')->name('live-updates.create');
    Route::post('/live-updates', [LiveUpdateController::class, 'store'])->middleware('permission:live-updates,create')->name('live-updates.store');
    Route::get('/live-updates/{liveUpdate}', [LiveUpdateController::class, 'show'])->middleware('permission:live-updates,view')->name('live-updates.show');
    Route::get('/live-updates/{liveUpdate}/edit', [LiveUpdateController::class, 'edit'])->middleware('permission:live-updates,update')->name('live-updates.edit');
    Route::patch('/live-updates/{liveUpdate}', [LiveUpdateController::class, 'update'])->middleware('permission:live-updates,update')->name('live-updates.update');
    Route::delete('/live-updates/{liveUpdate}', [LiveUpdateController::class, 'destroy'])->middleware('permission:live-updates,delete')->name('live-updates.destroy');
});

// Public page rendering route
Route::get('/p/{slug}', [PageController::class, 'render'])->name('pages.render');

require __DIR__.'/auth.php';
