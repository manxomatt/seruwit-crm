<?php

use App\Http\Controllers\Central\InvitationController;
use App\Http\Controllers\Central\WorkspaceController;
use App\Http\Controllers\Module\PlanController;
use App\Http\Controllers\Module\TenantController;
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

$centralDomain = parse_url(config('app.url'), PHP_URL_HOST) ?: 'localhost';

Route::domain($centralDomain)
    ->name('central.')
    ->group(function () {
        Route::middleware('auth')->group(function () {
            Route::get('/workspaces', [WorkspaceController::class, 'index'])->name('workspaces.index');
            Route::get('/workspaces/{tenant}/enter', [WorkspaceController::class, 'enter'])->name('workspaces.enter');
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

/*
|--------------------------------------------------------------------------
| Tenant Management (SaaS control plane)
|--------------------------------------------------------------------------
|
| The tenants/domains tables live only in the central schema, so this feature
| runs on the central domain exclusively. It is exposed under /module/tenants
| (name module.tenants.*) so it looks and behaves like any other CRM module,
| but it is gated to platform super admins via the manage-tenants ability.
|
*/

Route::domain($centralDomain)
    ->middleware(['auth', 'can:manage-tenants'])
    ->prefix('module')
    ->name('module.')
    ->group(function () {
        Route::get('/tenants', [TenantController::class, 'index'])->name('tenants.index');
        Route::post('/tenants', [TenantController::class, 'store'])->name('tenants.store');
        Route::get('/tenants/{tenant}', [TenantController::class, 'show'])->name('tenants.show');
        Route::patch('/tenants/{tenant}', [TenantController::class, 'update'])->name('tenants.update');
        Route::patch('/tenants/{tenant}/status', [TenantController::class, 'toggleStatus'])->name('tenants.toggle-status');
        Route::post('/tenants/{tenant}/modules/{module}', [TenantController::class, 'installModule'])->name('tenants.modules.install');
        Route::delete('/tenants/{tenant}/modules/{module}', [TenantController::class, 'uninstallModule'])->name('tenants.modules.uninstall');
        Route::delete('/tenants/{tenant}', [TenantController::class, 'destroy'])->name('tenants.destroy');
    });

/*
| Subscription plans: which modules each plan lets a tenant install. Central only
| and gated to platform super admins — a plan is a platform-wide definition, not
| something a workspace configures for itself.
*/
Route::domain($centralDomain)
    ->middleware(['auth', 'can:manage-plans'])
    ->prefix('module')
    ->name('module.')
    ->group(function () {
        Route::get('/plans', [PlanController::class, 'index'])->name('plans.index');
        Route::post('/plans', [PlanController::class, 'store'])->name('plans.store');
        Route::patch('/plans/{plan}', [PlanController::class, 'update'])->name('plans.update');
        Route::delete('/plans/{plan}', [PlanController::class, 'destroy'])->name('plans.destroy');
    });
