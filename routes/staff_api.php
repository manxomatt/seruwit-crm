<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Route;
use Modules\Rental\Http\Controllers\Api\Staff\StaffApprovalApiController;
use Modules\Rental\Http\Controllers\Api\Staff\StaffAuthController;
use Modules\Rental\Http\Controllers\Api\Staff\StaffDashboardApiController;
use Modules\Rental\Http\Controllers\Api\Staff\StaffDriverDutyApiController;
use Modules\Rental\Http\Controllers\Api\Staff\StaffHandoverApiController;

/*
|--------------------------------------------------------------------------
| Tenant Staff Mobile API (JSON) — Android / iOS Mobile Apps
|--------------------------------------------------------------------------
|
| Authenticated via Laravel Sanctum bearer tokens.
| Base prefix: /api/staff/v1
|
*/

Route::prefix('api/staff/v1')
    ->name('staff.v1.')
    ->group(function (): void {
        Route::post('/auth/login', [StaffAuthController::class, 'login'])->name('auth.login');

        Route::middleware('auth:sanctum')->group(function (): void {
            Route::post('/auth/logout', [StaffAuthController::class, 'logout'])->name('auth.logout');
            Route::get('/auth/me', [StaffAuthController::class, 'me'])->name('auth.me');

            // Dashboard & Monitoring
            Route::get('/dashboard/summary', [StaffDashboardApiController::class, 'summary'])->name('dashboard.summary');

            // Approvals (Payments & Extensions)
            Route::prefix('approvals')->name('approvals.')->group(function (): void {
                Route::get('/payments', [StaffApprovalApiController::class, 'paymentProofs'])->name('payments.index');
                Route::post('/payments/{rental}/confirm', [StaffApprovalApiController::class, 'confirmPayment'])->name('payments.confirm');
                Route::post('/payments/{rental}/reject', [StaffApprovalApiController::class, 'rejectPayment'])->name('payments.reject');

                Route::get('/extensions', [StaffApprovalApiController::class, 'extensions'])->name('extensions.index');
                Route::post('/extensions/{extensionRequest}/review', [StaffApprovalApiController::class, 'reviewExtension'])->name('extensions.review');
            });

            // Handover & Fleet Inspection (Checker / Ops Staff)
            Route::prefix('handovers')->name('handovers.')->group(function (): void {
                Route::get('/today', [StaffHandoverApiController::class, 'today'])->name('today');
                Route::post('/{rental}/out', [StaffHandoverApiController::class, 'handoverOut'])->name('out');
                Route::post('/{rental}/in', [StaffHandoverApiController::class, 'handoverIn'])->name('in');
                Route::post('/{rental}/ai-inspect', [StaffHandoverApiController::class, 'aiInspect'])->name('ai-inspect');
            });

            // Driver Duties & Expense Claims (Company Driver / Mobile Staff)
            Route::prefix('driver/duties')->name('driver.duties.')->group(function (): void {
                Route::get('/', [StaffDriverDutyApiController::class, 'index'])->name('index');
                Route::get('/{dutyOrder}', [StaffDriverDutyApiController::class, 'show'])->name('show');
                Route::post('/{dutyOrder}/status', [StaffDriverDutyApiController::class, 'updateStatus'])->name('status');
                Route::post('/{dutyOrder}/expenses', [StaffDriverDutyApiController::class, 'addExpense'])->name('expenses.store');
                Route::delete('/{dutyOrder}/expenses/{expense}', [StaffDriverDutyApiController::class, 'deleteExpense'])->name('expenses.destroy');
            });
        });
    });
