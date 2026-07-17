<?php

namespace App\Providers;

use App\Modules\Facades\Modules;
use App\Modules\ModuleRegistry;
use App\Modules\PlanRepository;
use Illuminate\Support\ServiceProvider;

/**
 * Wires every registered module into the framework.
 *
 * One provider serves all modules so that config/modules.php stays the single
 * source of truth — modules do not ship their own providers.
 */
class ModuleServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(ModuleRegistry::class);
        $this->app->singleton(PlanRepository::class);
    }

    public function boot(): void
    {
        foreach (Modules::all() as $module) {
            /**
             * Central runs every module, so its tables come from plain
             * `php artisan migrate`. Tenants get them only via an explicit
             * --path at install time, which suppresses these paths entirely.
             */
            $this->loadMigrationsFrom($module->migrationsPath());

            if ($viewsPath = $module->viewsPath()) {
                $this->loadViewsFrom($viewsPath, $module->key());
            }

            $module->boot();
        }
    }
}
