<?php

namespace Modules\DriverScoring;

use App\Modules\ModuleContract;
use App\Modules\ModuleTier;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Route;
use Modules\DriverScoring\Http\Controllers\DrivingEventController;
use Modules\DriverScoring\Http\Controllers\IncentiveAwardController;
use Modules\DriverScoring\Http\Controllers\IncentiveRuleController;
use Modules\DriverScoring\Http\Controllers\LeaderboardController;
use Modules\DriverScoring\Http\Controllers\ScoringSettingsController;
use Modules\DriverScoring\Listeners\DetectDrivingEvents;
use Modules\Tracking\Events\VehiclePositionsRecorded;

/**
 * Driver behaviour scoring from Traccar GPS (harsh brake, speeding, idle),
 * leaderboards, and incentive awards.
 */
class DriverScoringModule implements ModuleContract
{
    public function key(): string
    {
        return 'scoring';
    }

    public function label(): string
    {
        return 'Driver Scoring';
    }

    public function description(): string
    {
        return 'Score driving behaviour from Traccar GPS (harsh brake, speeding, idle), leaderboards, and incentives.';
    }

    public function tier(): ModuleTier
    {
        return ModuleTier::Foundation;
    }

    public function permissions(): array
    {
        return ['view', 'create', 'update', 'delete', 'award'];
    }

    public function requires(): array
    {
        return ['fleet', 'tracking'];
    }

    public function menu(): ?array
    {
        return [
            'name' => 'Driver Scoring',
            'slug' => 'scoring',
            'icon' => 'scoring',
            'route_name' => 'scoring.leaderboard',
            'permission_module' => 'scoring',
            'permission_action' => 'view',
            'sort_order' => 6,
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
        Event::listen(VehiclePositionsRecorded::class, DetectDrivingEvents::class);
    }

    public function routes(): void
    {
        Route::middleware(['auth', 'permission:scoring,view'])->group(function (): void {
            Route::get('/scoring', function () {
                return redirect('/module/scoring/leaderboard');
            });

            Route::prefix('scoring')->name('scoring.')->group(function (): void {
                Route::get('/leaderboard', [LeaderboardController::class, 'index'])->name('leaderboard');
                Route::get('/events', [DrivingEventController::class, 'index'])->name('events.index');
                Route::get('/drivers/{driver}', [LeaderboardController::class, 'show'])->name('drivers.show');

                Route::get('/incentives', [IncentiveRuleController::class, 'index'])->name('incentives.index');
                Route::post('/incentives', [IncentiveRuleController::class, 'store'])->middleware('permission:scoring,create')->name('incentives.store');
                Route::patch('/incentives/{rule}', [IncentiveRuleController::class, 'update'])->middleware('permission:scoring,update')->name('incentives.update');
                Route::delete('/incentives/{rule}', [IncentiveRuleController::class, 'destroy'])->middleware('permission:scoring,delete')->name('incentives.destroy');
                Route::post('/incentives/evaluate', [IncentiveRuleController::class, 'evaluate'])->middleware('permission:scoring,award')->name('incentives.evaluate');
                Route::post('/awards/{award}/status', [IncentiveAwardController::class, 'updateStatus'])->middleware('permission:scoring,award')->name('awards.status');

                Route::get('/settings', [ScoringSettingsController::class, 'edit'])->middleware('permission:scoring,update')->name('settings.edit');
                Route::patch('/settings', [ScoringSettingsController::class, 'update'])->middleware('permission:scoring,update')->name('settings.update');
            });
        });
    }
}
