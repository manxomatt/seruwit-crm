<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Route;
use Modules\Rental\Http\Controllers\Api\Staff\StaffApprovalApiController;
use Modules\Rental\Http\Controllers\Api\Staff\StaffAuthController;
use Modules\Rental\Http\Controllers\Api\Staff\StaffDashboardApiController;

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
        });
    });
