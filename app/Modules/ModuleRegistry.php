<?php

namespace App\Modules;

use App\Models\InstalledModule;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Schema;

class ModuleRegistry
{
    /**
     * @var array<string, ModuleContract>|null
     */
    private ?array $modules = null;

    /**
     * Installed module keys, memoized per tenant for the life of the request.
     *
     * @var array<string, list<string>>
     */
    private array $installedKeys = [];

    /**
     * Every registered module, keyed by module key.
     *
     * @return array<string, ModuleContract>
     */
    public function all(): array
    {
        if ($this->modules !== null) {
            return $this->modules;
        }

        $modules = [];

        foreach (config('modules.registered', []) as $class) {
            $module = app($class);
            $modules[$module->key()] = $module;
        }

        return $this->modules = $modules;
    }

    public function find(string $key): ?ModuleContract
    {
        return $this->all()[$key] ?? null;
    }

    /**
     * Whether $key names a registered, optional module. Core features such as
     * users or settings are deliberately absent from the registry.
     */
    public function has(string $key): bool
    {
        return isset($this->all()[$key]);
    }

    /**
     * Whether the feature is available in the current context.
     *
     * Fails open by design. Anything that is not a registered module is core and
     * always available — that is what keeps the guards correct while modules are
     * still being extracted one by one. The central domain runs every module, and
     * a schema without the installed_modules table yet (mid-migration) is treated
     * as having everything, so a half-migrated deploy never dark-fires a guard.
     */
    public function installed(string $key): bool
    {
        if (! $this->has($key)) {
            return true;
        }

        if (! tenancy()->initialized) {
            return true;
        }

        return in_array($key, $this->installedKeysForCurrentTenant(), true);
    }

    /**
     * @return list<string>
     */
    private function installedKeysForCurrentTenant(): array
    {
        $tenantKey = (string) tenant('id');

        if (array_key_exists($tenantKey, $this->installedKeys)) {
            return $this->installedKeys[$tenantKey];
        }

        if (! Schema::hasTable('installed_modules')) {
            return $this->installedKeys[$tenantKey] = array_keys($this->all());
        }

        return $this->installedKeys[$tenantKey] = InstalledModule::query()
            ->installed()
            ->pluck('key')
            ->all();
    }

    /**
     * Drop the memoized install state. Install and uninstall mutate the table
     * underneath a long-lived registry singleton, so they must call this.
     */
    public function flushInstalledState(): void
    {
        $this->installedKeys = [];
    }

    /**
     * Register every module's routes inside the caller's route group, each behind
     * its own requires-module gate so an individual module never has to remember.
     */
    public function registerRoutes(): void
    {
        foreach ($this->all() as $module) {
            Route::middleware('requires-module:'.$module->key())
                ->group(fn () => $module->routes());
        }
    }
}
