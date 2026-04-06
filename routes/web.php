<?php

use App\Http\Controllers\Admin\AnalyticsController;
use App\Http\Controllers\Admin\CarouselController;
use App\Http\Controllers\Admin\CarouselImageController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\GlobalSearchController;
use App\Http\Controllers\Admin\MediaController;
use App\Http\Controllers\Admin\PageController as AdminPageController;
use App\Http\Controllers\Admin\PostController;
use App\Http\Controllers\Admin\RoleController;
use App\Http\Controllers\Admin\SettingController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\Custom\DashboardController as CustomDashboardController;
use App\Http\Controllers\LiveUpdateController;
use App\Http\Controllers\PageController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\TodoController;
use App\Http\Controllers\User\DashboardController as UserDashboardController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', [PageController::class, 'homepage'])->name('home');

Route::get('/dashboard', function () {
    return Inertia::render('Dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware('auth')->group(function () {
    // User Dashboard Routes
    Route::prefix('user')->name('user.')->group(function () {
        Route::get('/dashboard', [UserDashboardController::class, 'index'])->name('dashboard');

        // User Page Routes (reuse Admin controllers with permission middleware)
        Route::get('/pages', [AdminPageController::class, 'index'])->middleware('permission:pages,view')->name('pages.index');
        Route::get('/pages/create', [AdminPageController::class, 'create'])->middleware('permission:pages,create')->name('pages.create');
        Route::post('/pages', [AdminPageController::class, 'store'])->middleware('permission:pages,create')->name('pages.store');
        Route::get('/pages/{page}', [AdminPageController::class, 'show'])->middleware('permission:pages,view')->name('pages.show');
        Route::get('/pages/{page}/edit', [AdminPageController::class, 'edit'])->middleware('permission:pages,update')->name('pages.edit');
        Route::patch('/pages/{page}', [AdminPageController::class, 'update'])->middleware('permission:pages,update')->name('pages.update');
        Route::patch('/pages/{page}/save-content', [AdminPageController::class, 'saveContent'])->middleware('permission:pages,update')->name('pages.save-content');
        Route::patch('/pages/{page}/set-homepage', [AdminPageController::class, 'setHomepage'])->middleware('permission:pages,update')->name('pages.set-homepage');
        Route::delete('/pages/{page}', [AdminPageController::class, 'destroy'])->middleware('permission:pages,delete')->name('pages.destroy');

        // User Post Routes
        Route::get('/posts', [PostController::class, 'index'])->middleware('permission:posts,view')->name('posts.index');
        Route::get('/posts/create', [PostController::class, 'create'])->middleware('permission:posts,create')->name('posts.create');
        Route::post('/posts', [PostController::class, 'store'])->middleware('permission:posts,create')->name('posts.store');
        Route::get('/posts/{post}', [PostController::class, 'show'])->middleware('permission:posts,view')->name('posts.show');
        Route::get('/posts/{post}/edit', [PostController::class, 'edit'])->middleware('permission:posts,update')->name('posts.edit');
        Route::patch('/posts/{post}', [PostController::class, 'update'])->middleware('permission:posts,update')->name('posts.update');
        Route::patch('/posts/{post}/toggle-publish', [PostController::class, 'togglePublish'])->middleware('permission:posts,update')->name('posts.toggle-publish');
        Route::delete('/posts/{post}', [PostController::class, 'destroy'])->middleware('permission:posts,delete')->name('posts.destroy');

        // User Carousel Routes
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

        // User Media Routes
        Route::get('/media', [MediaController::class, 'index'])->middleware('permission:media,view')->name('media.index');
        Route::get('/media/create', [MediaController::class, 'create'])->middleware('permission:media,create')->name('media.create');
        Route::post('/media', [MediaController::class, 'store'])->middleware('permission:media,create')->name('media.store');
        Route::post('/media/upload', [MediaController::class, 'upload'])->middleware('permission:media,create')->name('media.upload');
        Route::get('/media/picker', [MediaController::class, 'picker'])->middleware('permission:media,view')->name('media.picker');
        Route::post('/media/bulk-destroy', [MediaController::class, 'bulkDestroy'])->middleware('permission:media,delete')->name('media.bulk-destroy');
        Route::get('/media/{medium}', [MediaController::class, 'show'])->middleware('permission:media,view')->name('media.show');
        Route::get('/media/{medium}/edit', [MediaController::class, 'edit'])->middleware('permission:media,update')->name('media.edit');
        Route::patch('/media/{medium}', [MediaController::class, 'update'])->middleware('permission:media,update')->name('media.update');
        Route::delete('/media/{medium}', [MediaController::class, 'destroy'])->middleware('permission:media,delete')->name('media.destroy');

        // User Analytics Routes
        Route::get('/analytics', [AnalyticsController::class, 'index'])->middleware('permission:analytics,view')->name('analytics.index');

        // User Settings Routes
        Route::get('/settings', [SettingController::class, 'index'])->middleware('permission:settings,view')->name('settings.index');
        Route::get('/settings/create', [SettingController::class, 'create'])->middleware('permission:settings,create')->name('settings.create');
        Route::post('/settings', [SettingController::class, 'store'])->middleware('permission:settings,create')->name('settings.store');
        Route::post('/settings/bulk-update', [SettingController::class, 'bulkUpdate'])->middleware('permission:settings,update')->name('settings.bulk-update');
        Route::get('/settings/{setting}', [SettingController::class, 'show'])->middleware('permission:settings,view')->name('settings.show');
        Route::get('/settings/{setting}/edit', [SettingController::class, 'edit'])->middleware('permission:settings,update')->name('settings.edit');
        Route::patch('/settings/{setting}', [SettingController::class, 'update'])->middleware('permission:settings,update')->name('settings.update');
        Route::delete('/settings/{setting}', [SettingController::class, 'destroy'])->middleware('permission:settings,delete')->name('settings.destroy');
    });

    // Custom Role Dashboard Routes
    Route::prefix('custom')->name('custom.')->group(function () {
        Route::get('/dashboard', [CustomDashboardController::class, 'index'])->name('dashboard');
    });

    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::post('/profile/avatar', [ProfileController::class, 'updateAvatar'])->name('profile.avatar.update');
    Route::delete('/profile/avatar', [ProfileController::class, 'destroyAvatar'])->name('profile.avatar.destroy');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    // Admin Routes
    Route::prefix('admin')->name('admin.')->group(function () {
        Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

        // Global Search
        Route::get('/search', [GlobalSearchController::class, 'search'])->name('search');

        // Page Builder Routes
        Route::get('/pages', [AdminPageController::class, 'index'])->middleware('permission:pages,view')->name('pages.index');
        Route::get('/pages/create', [AdminPageController::class, 'create'])->middleware('permission:pages,create')->name('pages.create');
        Route::post('/pages', [AdminPageController::class, 'store'])->middleware('permission:pages,create')->name('pages.store');
        Route::get('/pages/{page}', [AdminPageController::class, 'show'])->middleware('permission:pages,view')->name('pages.show');
        Route::get('/pages/{page}/edit', [AdminPageController::class, 'edit'])->middleware('permission:pages,update')->name('pages.edit');
        Route::patch('/pages/{page}', [AdminPageController::class, 'update'])->middleware('permission:pages,update')->name('pages.update');
        Route::patch('/pages/{page}/save-content', [AdminPageController::class, 'saveContent'])->middleware('permission:pages,update')->name('pages.save-content');
        Route::patch('/pages/{page}/set-homepage', [AdminPageController::class, 'setHomepage'])->middleware('permission:pages,update')->name('pages.set-homepage');
        Route::delete('/pages/{page}', [AdminPageController::class, 'destroy'])->middleware('permission:pages,delete')->name('pages.destroy');

        // Carousel Routes
        Route::get('/carousels', [CarouselController::class, 'index'])->middleware('permission:carousels,view')->name('carousels.index');
        Route::get('/carousels/create', [CarouselController::class, 'create'])->middleware('permission:carousels,create')->name('carousels.create');
        Route::post('/carousels', [CarouselController::class, 'store'])->middleware('permission:carousels,create')->name('carousels.store');
        Route::get('/carousels/{carousel}', [CarouselController::class, 'show'])->middleware('permission:carousels,view')->name('carousels.show');
        Route::get('/carousels/{carousel}/edit', [CarouselController::class, 'edit'])->middleware('permission:carousels,update')->name('carousels.edit');
        Route::patch('/carousels/{carousel}', [CarouselController::class, 'update'])->middleware('permission:carousels,update')->name('carousels.update');
        Route::delete('/carousels/{carousel}', [CarouselController::class, 'destroy'])->middleware('permission:carousels,delete')->name('carousels.destroy');

        // Carousel Image Routes (inherit carousel permissions)
        Route::post('/carousels/{carousel}/images', [CarouselImageController::class, 'store'])->middleware('permission:carousels,create')->name('carousels.images.store');
        Route::patch('/carousels/{carousel}/images/{image}', [CarouselImageController::class, 'update'])->middleware('permission:carousels,update')->name('carousels.images.update');
        Route::delete('/carousels/{carousel}/images/{image}', [CarouselImageController::class, 'destroy'])->middleware('permission:carousels,delete')->name('carousels.images.destroy');
        Route::post('/carousels/{carousel}/images/reorder', [CarouselImageController::class, 'reorder'])->middleware('permission:carousels,update')->name('carousels.images.reorder');

        // Media Library Routes
        Route::get('/media', [MediaController::class, 'index'])->middleware('permission:media,view')->name('media.index');
        Route::get('/media/create', [MediaController::class, 'create'])->middleware('permission:media,create')->name('media.create');
        Route::post('/media', [MediaController::class, 'store'])->middleware('permission:media,create')->name('media.store');
        Route::post('/media/upload', [MediaController::class, 'upload'])->middleware('permission:media,create')->name('media.upload');
        Route::get('/media/picker', [MediaController::class, 'picker'])->middleware('permission:media,view')->name('media.picker');
        Route::post('/media/bulk-destroy', [MediaController::class, 'bulkDestroy'])->middleware('permission:media,delete')->name('media.bulk-destroy');
        Route::get('/media/{medium}', [MediaController::class, 'show'])->middleware('permission:media,view')->name('media.show');
        Route::get('/media/{medium}/edit', [MediaController::class, 'edit'])->middleware('permission:media,update')->name('media.edit');
        Route::patch('/media/{medium}', [MediaController::class, 'update'])->middleware('permission:media,update')->name('media.update');
        Route::delete('/media/{medium}', [MediaController::class, 'destroy'])->middleware('permission:media,delete')->name('media.destroy');

        // User Management Routes
        Route::get('/users', [UserController::class, 'index'])->middleware('permission:users,view')->name('users.index');
        Route::get('/users/create', [UserController::class, 'create'])->middleware('permission:users,create')->name('users.create');
        Route::post('/users', [UserController::class, 'store'])->middleware('permission:users,create')->name('users.store');
        Route::get('/users/{user}', [UserController::class, 'show'])->middleware('permission:users,view')->name('users.show');
        Route::get('/users/{user}/edit', [UserController::class, 'edit'])->middleware('permission:users,update')->name('users.edit');
        Route::patch('/users/{user}', [UserController::class, 'update'])->middleware('permission:users,update')->name('users.update');
        Route::delete('/users/{user}', [UserController::class, 'destroy'])->middleware('permission:users,delete')->name('users.destroy');

        // Settings Routes
        Route::get('/settings', [SettingController::class, 'index'])->middleware('permission:settings,view')->name('settings.index');
        Route::get('/settings/create', [SettingController::class, 'create'])->middleware('permission:settings,create')->name('settings.create');
        Route::post('/settings', [SettingController::class, 'store'])->middleware('permission:settings,create')->name('settings.store');
        Route::post('/settings/bulk-update', [SettingController::class, 'bulkUpdate'])->middleware('permission:settings,update')->name('settings.bulk-update');
        Route::get('/settings/{setting}', [SettingController::class, 'show'])->middleware('permission:settings,view')->name('settings.show');
        Route::get('/settings/{setting}/edit', [SettingController::class, 'edit'])->middleware('permission:settings,update')->name('settings.edit');
        Route::patch('/settings/{setting}', [SettingController::class, 'update'])->middleware('permission:settings,update')->name('settings.update');
        Route::delete('/settings/{setting}', [SettingController::class, 'destroy'])->middleware('permission:settings,delete')->name('settings.destroy');

        // Analytics Routes
        Route::get('/analytics', [AnalyticsController::class, 'index'])->middleware('permission:analytics,view')->name('analytics.index');

        // Role Management Routes
        Route::get('/roles', [RoleController::class, 'index'])->middleware('permission:roles,view')->name('roles.index');
        Route::get('/roles/create', [RoleController::class, 'create'])->middleware('permission:roles,create')->name('roles.create');
        Route::post('/roles', [RoleController::class, 'store'])->middleware('permission:roles,create')->name('roles.store');
        Route::get('/roles/{role}', [RoleController::class, 'show'])->middleware('permission:roles,view')->name('roles.show');
        Route::get('/roles/{role}/edit', [RoleController::class, 'edit'])->middleware('permission:roles,update')->name('roles.edit');
        Route::patch('/roles/{role}', [RoleController::class, 'update'])->middleware('permission:roles,update')->name('roles.update');
        Route::delete('/roles/{role}', [RoleController::class, 'destroy'])->middleware('permission:roles,delete')->name('roles.destroy');

        // Post/Blog Routes
        Route::get('/posts', [PostController::class, 'index'])->middleware('permission:posts,view')->name('posts.index');
        Route::get('/posts/create', [PostController::class, 'create'])->middleware('permission:posts,create')->name('posts.create');
        Route::post('/posts', [PostController::class, 'store'])->middleware('permission:posts,create')->name('posts.store');
        Route::get('/posts/{post}', [PostController::class, 'show'])->middleware('permission:posts,view')->name('posts.show');
        Route::get('/posts/{post}/edit', [PostController::class, 'edit'])->middleware('permission:posts,update')->name('posts.edit');
        Route::patch('/posts/{post}', [PostController::class, 'update'])->middleware('permission:posts,update')->name('posts.update');
        Route::patch('/posts/{post}/toggle-publish', [PostController::class, 'togglePublish'])->middleware('permission:posts,update')->name('posts.toggle-publish');
        Route::delete('/posts/{post}', [PostController::class, 'destroy'])->middleware('permission:posts,delete')->name('posts.destroy');
    });

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
