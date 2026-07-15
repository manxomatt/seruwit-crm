<?php

use App\Http\Controllers\Central\InvitationController;
use App\Http\Controllers\Central\TenantAdminController;
use App\Http\Controllers\Central\WorkspaceController;
use App\Http\Controllers\PageController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Central Routes
|--------------------------------------------------------------------------
|
| Bound to the central domain with a "central." name prefix, so their names
| never collide with the tenant routes (routes/tenant.php) that register
| the same URIs domain-less — which keeps route:cache usable.
|
| CENTRAL_SERVES_APP=true (default, for local development) serves the full
| CRM on the central domain too. In production set it to false: the central
| domain then only offers the landing page, auth, the workspace portal,
| tenant administration, and invitation acceptance.
|
*/

Route::domain(parse_url(config('app.url'), PHP_URL_HOST) ?: 'localhost')
    ->name('central.')
    ->group(function () {
        Route::middleware('auth')->group(function () {
            Route::get('/workspaces', [WorkspaceController::class, 'index'])->name('workspaces.index');
            Route::get('/workspaces/{tenant}/enter', [WorkspaceController::class, 'enter'])->name('workspaces.enter');
        });

        // Platform super admin — tenant management
        Route::middleware(['auth', 'can:manage-tenants'])->prefix('admin')->group(function () {
            Route::get('/tenants', [TenantAdminController::class, 'index'])->name('tenants.index');
            Route::post('/tenants', [TenantAdminController::class, 'store'])->name('tenants.store');
            Route::patch('/tenants/{tenant}/status', [TenantAdminController::class, 'toggleStatus'])->name('tenants.toggle-status');
        });

        // Invitation acceptance (guest-accessible; account may not exist yet)
        Route::get('/invitations/{token}', [InvitationController::class, 'show'])->name('invitations.show');
        Route::post('/invitations/{token}', [InvitationController::class, 'accept'])->name('invitations.accept');

        if (config('app.central_serves_app')) {
            require __DIR__.'/app.php';
        } else {
            Route::get('/', [PageController::class, 'homepage'])->name('home');

            require __DIR__.'/auth.php';
        }
    });
