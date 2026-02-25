<?php

use App\Http\Controllers\Admin\CarouselController;
use App\Http\Controllers\Admin\CarouselImageController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\PageController as AdminPageController;
use App\Http\Controllers\LiveUpdateController;
use App\Http\Controllers\PageController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\TodoController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', [PageController::class, 'homepage'])->name('home');

Route::get('/dashboard', function () {
    return Inertia::render('Dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    // Admin Routes
    Route::prefix('admin')->name('admin.')->group(function () {
        Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

        // Page Builder Routes
        Route::get('/pages', [AdminPageController::class, 'index'])->name('pages.index');
        Route::get('/pages/create', [AdminPageController::class, 'create'])->name('pages.create');
        Route::post('/pages', [AdminPageController::class, 'store'])->name('pages.store');
        Route::get('/pages/{page}', [AdminPageController::class, 'show'])->name('pages.show');
        Route::get('/pages/{page}/edit', [AdminPageController::class, 'edit'])->name('pages.edit');
        Route::patch('/pages/{page}', [AdminPageController::class, 'update'])->name('pages.update');
        Route::patch('/pages/{page}/save-content', [AdminPageController::class, 'saveContent'])->name('pages.save-content');
        Route::patch('/pages/{page}/set-homepage', [AdminPageController::class, 'setHomepage'])->name('pages.set-homepage');
        Route::delete('/pages/{page}', [AdminPageController::class, 'destroy'])->name('pages.destroy');

        // Carousel Routes
        Route::get('/carousels', [CarouselController::class, 'index'])->name('carousels.index');
        Route::get('/carousels/create', [CarouselController::class, 'create'])->name('carousels.create');
        Route::post('/carousels', [CarouselController::class, 'store'])->name('carousels.store');
        Route::get('/carousels/{carousel}', [CarouselController::class, 'show'])->name('carousels.show');
        Route::get('/carousels/{carousel}/edit', [CarouselController::class, 'edit'])->name('carousels.edit');
        Route::patch('/carousels/{carousel}', [CarouselController::class, 'update'])->name('carousels.update');
        Route::delete('/carousels/{carousel}', [CarouselController::class, 'destroy'])->name('carousels.destroy');

        // Carousel Image Routes
        Route::post('/carousels/{carousel}/images', [CarouselImageController::class, 'store'])->name('carousels.images.store');
        Route::patch('/carousels/{carousel}/images/{image}', [CarouselImageController::class, 'update'])->name('carousels.images.update');
        Route::delete('/carousels/{carousel}/images/{image}', [CarouselImageController::class, 'destroy'])->name('carousels.images.destroy');
        Route::post('/carousels/{carousel}/images/reorder', [CarouselImageController::class, 'reorder'])->name('carousels.images.reorder');
    });

    Route::get('/todos', [TodoController::class, 'index'])->name('todos.index');
    Route::post('/todos', [TodoController::class, 'store'])->name('todos.store');
    Route::patch('/todos/{todo}', [TodoController::class, 'update'])->name('todos.update');
    Route::delete('/todos/{todo}', [TodoController::class, 'destroy'])->name('todos.destroy');

    Route::get('/live-updates', [LiveUpdateController::class, 'index'])->name('live-updates.index');
    Route::get('/live-updates/create', [LiveUpdateController::class, 'create'])->name('live-updates.create');
    Route::post('/live-updates', [LiveUpdateController::class, 'store'])->name('live-updates.store');
    Route::get('/live-updates/{liveUpdate}', [LiveUpdateController::class, 'show'])->name('live-updates.show');
    Route::get('/live-updates/{liveUpdate}/edit', [LiveUpdateController::class, 'edit'])->name('live-updates.edit');
    Route::patch('/live-updates/{liveUpdate}', [LiveUpdateController::class, 'update'])->name('live-updates.update');
    Route::delete('/live-updates/{liveUpdate}', [LiveUpdateController::class, 'destroy'])->name('live-updates.destroy');
});

// Public page rendering route
Route::get('/p/{slug}', [PageController::class, 'render'])->name('pages.render');

require __DIR__.'/auth.php';
