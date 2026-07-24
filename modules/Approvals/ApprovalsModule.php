<?php

namespace Modules\Approvals;

use App\Modules\ModuleContract;
use App\Modules\ModuleTier;
use Illuminate\Support\Facades\Route;
use Modules\Approvals\Http\Controllers\ApprovalPolicyController;
use Modules\Approvals\Http\Controllers\ApprovalRequestController;

/**
 * Configurable multi-level approval workflows (per tenant).
 *
 * Domains call ApprovalGate with opaque trigger keys; this module owns
 * policies, inbox UI, and emits ApprovalCompleted / ApprovalRejected so
 * domains can resume without Approvals knowing their UI.
 */
class ApprovalsModule implements ModuleContract
{
    public function key(): string
    {
        return 'approvals';
    }

    public function label(): string
    {
        return 'Approvals';
    }

    public function description(): string
    {
        return 'Multi-level approval workflows for discounts, credit overrides, large POs, and SLA exceptions — configurable per tenant.';
    }

    public function tier(): ModuleTier
    {
        return ModuleTier::Foundation;
    }

    public function permissions(): array
    {
        return ['view', 'create', 'update', 'delete', 'decide'];
    }

    public function requires(): array
    {
        return [];
    }

    public function menu(): ?array
    {
        return [
            'name' => 'Approvals',
            'slug' => 'approvals',
            'icon' => 'approvals',
            'route_name' => 'approvals.requests.index',
            'permission_module' => 'approvals',
            'permission_action' => 'view',
            'sort_order' => 14,
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

    public function boot(): void
    {
        //
    }

    public function routes(): void
    {
        Route::middleware(['auth', 'permission:approvals,view'])->group(function (): void {
            Route::get('/approvals', function () {
                return redirect('/module/approvals/requests');
            });

            Route::prefix('approvals')->name('approvals.')->group(function (): void {
                Route::get('/requests', [ApprovalRequestController::class, 'index'])->name('requests.index');
                Route::get('/requests/{approvalRequest}', [ApprovalRequestController::class, 'show'])->name('requests.show');
                Route::post('/requests/{approvalRequest}/approve', [ApprovalRequestController::class, 'approve'])->middleware('permission:approvals,decide')->name('requests.approve');
                Route::post('/requests/{approvalRequest}/reject', [ApprovalRequestController::class, 'reject'])->middleware('permission:approvals,decide')->name('requests.reject');

                Route::get('/policies', [ApprovalPolicyController::class, 'index'])->name('policies.index');
                Route::get('/policies/create', [ApprovalPolicyController::class, 'create'])->middleware('permission:approvals,create')->name('policies.create');
                Route::post('/policies', [ApprovalPolicyController::class, 'store'])->middleware('permission:approvals,create')->name('policies.store');
                Route::get('/policies/{policy}/edit', [ApprovalPolicyController::class, 'edit'])->middleware('permission:approvals,update')->name('policies.edit');
                Route::patch('/policies/{policy}', [ApprovalPolicyController::class, 'update'])->middleware('permission:approvals,update')->name('policies.update');
                Route::delete('/policies/{policy}', [ApprovalPolicyController::class, 'destroy'])->middleware('permission:approvals,delete')->name('policies.destroy');
            });
        });
    }
}
