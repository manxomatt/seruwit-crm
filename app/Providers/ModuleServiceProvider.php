<?php

namespace App\Providers;

use App\Modules\Facades\Modules;
use App\Modules\ModuleContract;
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
        foreach (Modules::core() as $module) {
            $this->bootModule($module, loadMigrations: false);
        }

        /**
         * When central serves the full app (CENTRAL_SERVES_APP=true), it runs
         * every optional module, so their tables come from plain
         * `php artisan migrate` on the central schema. When central is a thin
         * control plane (false), these module migrations must NOT be registered
         * on the default migrator — otherwise `migrate`/`migrate:fresh` would
         * still create module tables (products, canvassing, maintenance, …) in
         * the central schema. Tenants get module tables regardless, on demand,
         * via ModuleInstaller's explicit `--path` at install time.
         *
         * Core finance migrations live under database/migrations(+ /tenant) and
         * are unaffected by this flag.
         */
        $loadModuleMigrations = (bool) config('app.central_serves_app');

        foreach (Modules::all() as $module) {
            $this->bootModule($module, loadMigrations: $loadModuleMigrations);
        }
    }

    private function bootModule(ModuleContract $module, bool $loadMigrations): void
    {
        if ($loadMigrations) {
            $this->loadMigrationsFrom($module->migrationsPath());
        }

        if ($viewsPath = $module->viewsPath()) {
            $this->loadViewsFrom($viewsPath, $module->key());
        }

        $module->boot();
    }
}
