<?php

use App\Http\Controllers\Central\InvitationController;
use App\Http\Controllers\Central\TenantAdminController;
use App\Http\Controllers\Central\WorkspaceController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Central Routes
|--------------------------------------------------------------------------
|
| Explicitly bound to the central domain so they never collide with tenant
| routes (routes/tenant.php), which register the same URIs domain-less.
|
| The full CRM application (routes/app.php) is transitionally still served
| on the central domain as well; the long-term home for it is the tenant
| domains.
|
*/

Route::domain(parse_url(config('app.url'), PHP_URL_HOST) ?: 'localhost')->group(function () {
    Route::middleware('auth')->group(function () {
        Route::get('/workspaces', [WorkspaceController::class, 'index'])->name('central.workspaces.index');
        Route::get('/workspaces/{tenant}/enter', [WorkspaceController::class, 'enter'])->name('central.workspaces.enter');
    });

    // Platform super admin — tenant management
    Route::middleware(['auth', 'can:manage-tenants'])->prefix('admin')->group(function () {
        Route::get('/tenants', [TenantAdminController::class, 'index'])->name('central.tenants.index');
        Route::post('/tenants', [TenantAdminController::class, 'store'])->name('central.tenants.store');
        Route::patch('/tenants/{tenant}/status', [TenantAdminController::class, 'toggleStatus'])->name('central.tenants.toggle-status');
    });

    // Invitation acceptance (guest-accessible; account may not exist yet)
    Route::get('/invitations/{token}', [InvitationController::class, 'show'])->name('central.invitations.show');
    Route::post('/invitations/{token}', [InvitationController::class, 'accept'])->name('central.invitations.accept');

    require __DIR__.'/app.php';
});
