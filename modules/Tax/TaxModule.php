<?php

namespace Modules\Tax;

use App\Modules\ModuleContract;
use App\Modules\ModuleTier;
use Illuminate\Support\Facades\Route;
use Modules\Tax\Http\Controllers\TaxCodeController;
use Modules\Tax\Http\Controllers\TaxPolicyController;
use Modules\Tax\Http\Controllers\TaxRegisterController;
use Modules\Tax\Http\Controllers\WhtPayableReportController;

/**
 * Indonesian Tax Compliance module: PPN 11%/12% tax codes, PPh 23/4(2) withholding,
 * channel tax policies, PPN input/output tax register (e-Faktur CSV), and WHT payable report.
 */
class TaxModule implements ModuleContract
{
    public function key(): string
    {
        return 'tax';
    }

    public function label(): string
    {
        return 'Pajak & e-Faktur';
    }

    public function description(): string
    {
        return 'Manajemen kode pajak (PPN 11%/12%, PPh 23/4(2)), kebijakan pajak per kanal, register PPN keluaran/masukan, dan laporan utang PPh.';
    }

    public function tier(): ModuleTier
    {
        return ModuleTier::Foundation;
    }

    public function permissions(): array
    {
        return [
            'view',
            'create',
            'update',
            'delete',
            'manage_tax',
        ];
    }

    public function requires(): array
    {
        return ['accounting'];
    }

    public function menu(): ?array
    {
        return [
            'name' => 'Pajak & e-Faktur',
            'slug' => 'tax',
            'icon' => 'receipt-tax',
            'route_name' => 'tax.codes.index',
            'permission_module' => 'tax',
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
        Route::middleware(['auth', 'permission:tax|accounting,view'])->prefix('tax')->name('tax.')->group(function (): void {
            Route::get('/', [TaxCodeController::class, 'index'])->name('index');
            Route::get('/codes', [TaxCodeController::class, 'index'])->name('codes.index');
            Route::get('/tax-codes', [TaxCodeController::class, 'index'])->name('tax-codes.index');
            Route::get('/codes/create', [TaxCodeController::class, 'create'])
                ->middleware('permission:tax|accounting,manage_tax')
                ->name('codes.create');
            Route::post('/codes', [TaxCodeController::class, 'store'])
                ->middleware('permission:tax|accounting,manage_tax')
                ->name('codes.store');
            Route::get('/codes/{taxCode}/edit', [TaxCodeController::class, 'edit'])
                ->middleware('permission:tax|accounting,manage_tax')
                ->name('codes.edit');
            Route::patch('/codes/{taxCode}', [TaxCodeController::class, 'update'])
                ->middleware('permission:tax|accounting,manage_tax')
                ->name('codes.update');

            Route::get('/policies', [TaxPolicyController::class, 'index'])->name('policies.index');
            Route::put('/policies', [TaxPolicyController::class, 'update'])
                ->middleware('permission:tax|accounting,manage_tax')
                ->name('policies.update');

            Route::get('/register', [TaxRegisterController::class, 'show'])->name('register.show');
            Route::get('/register/export', [TaxRegisterController::class, 'export'])->name('register.export');
            Route::get('/wht-payable', [WhtPayableReportController::class, 'show'])->name('wht-payable.show');
        });
    }
}
