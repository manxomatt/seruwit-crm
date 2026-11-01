<?php

namespace Modules\DriverPayroll;

use App\Modules\ModuleContract;
use App\Modules\ModuleTier;
use Illuminate\Support\Facades\Route;
use Modules\DriverPayroll\Http\Controllers\DriverPayrollController;

class DriverPayrollModule implements ModuleContract
{
    public function key(): string
    {
        return 'driver-payroll';
    }

    public function label(): string
    {
        return 'Driver Payroll';
    }

    public function description(): string
    {
        return 'Penggajian pengemudi: konsolidasi uang harian SPPD, lembur surat jalan, komisi ritase, bonus, potongan kasbon, dan pencairan ke kas/bank.';
    }

    public function tier(): ModuleTier
    {
        return ModuleTier::Vertical;
    }

    public function permissions(): array
    {
        return [
            'view',
            'create',
            'approve',
            'disburse',
            'delete',
        ];
    }

    public function requires(): array
    {
        return ['driver'];
    }

    public function menu(): ?array
    {
        return [
            'name' => 'Payroll Pengemudi',
            'slug' => 'driver-payroll',
            'icon' => 'banknotes',
            'route_name' => 'driver-payroll.index',
            'permission_module' => 'driver-payroll',
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
        Route::get('/driver-payrolls', [DriverPayrollController::class, 'index'])
            ->middleware('permission:driver-payroll,view')
            ->name('driver-payroll.index');

        Route::post('/driver-payrolls/generate', [DriverPayrollController::class, 'generate'])
            ->middleware('permission:driver-payroll,create')
            ->name('driver-payroll.generate');

        Route::get('/driver-payrolls/{payroll}', [DriverPayrollController::class, 'show'])
            ->whereNumber('payroll')
            ->middleware('permission:driver-payroll,view')
            ->name('driver-payroll.show');

        Route::post('/driver-payrolls/{payroll}/approve', [DriverPayrollController::class, 'approve'])
            ->whereNumber('payroll')
            ->middleware('permission:driver-payroll,approve')
            ->name('driver-payroll.approve');

        Route::post('/driver-payrolls/{payroll}/disburse', [DriverPayrollController::class, 'disburse'])
            ->whereNumber('payroll')
            ->middleware('permission:driver-payroll,disburse')
            ->name('driver-payroll.disburse');

        Route::get('/driver-payrolls/{payroll}/print', [DriverPayrollController::class, 'print'])
            ->whereNumber('payroll')
            ->middleware('permission:driver-payroll,view')
            ->name('driver-payroll.print');

        Route::delete('/driver-payrolls/{payroll}', [DriverPayrollController::class, 'destroy'])
            ->whereNumber('payroll')
            ->middleware('permission:driver-payroll,delete')
            ->name('driver-payroll.destroy');
    }
}
