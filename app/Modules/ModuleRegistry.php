<?php

namespace App\Modules;

use App\Models\InstalledModule;
use App\Models\ModuleSetting;
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
     * Platform-disabled module keys, memoized for the life of the request.
     * Central data, so it never varies by tenant the way installed keys do.
     *
     * @var list<string>|null
     */
    private ?array $disabledKeys = null;

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
     * Whether the current tenant's plan permits this module.
     *
     * Entitlement is the plan's answer to "may you have it", independent of
     * whether the tenant took it. Resolved from the tenant record already loaded
     * by tenancy, so it costs no query.
     */
    public function entitled(string $key): bool
    {
        if (! $this->has($key)) {
            return true;
        }

        if (! tenancy()->initialized) {
            return true;
        }

        return tenant()->isEntitledTo($key);
    }

    /**
     * Whether the module's tables exist in the current tenant's schema.
     *
     * Fails open by design. Anything that is not a registered module is core and
     * always present — that is what keeps the guards correct while modules are
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
     * Whether the module should actually be reachable right now.
     *
     * This is what guards, middleware and menus ask — never installed() alone.
     * A downgrade revokes entitlement without uninstalling, so a module can be
     * installed yet unreachable; its data sits untouched and an upgrade brings it
     * straight back. A platform-wide disable behaves the same way: it overrides
     * entitlement/install without touching either.
     */
    public function available(string $key): bool
    {
        return $this->platformEnabled($key) && $this->entitled($key) && $this->installed($key);
    }

    /**
     * Whether a super admin has turned this module off platform-wide. This is
     * independent of any tenant's plan or install state — it overrides both.
     * Unregistered keys (core features) are never gated.
     */
    public function platformEnabled(string $key): bool
    {
        if (! $this->has($key)) {
            return true;
        }

        return ! in_array($key, $this->disabledKeys(), true);
    }

    /**
     * @return list<string>
     */
    private function disabledKeys(): array
    {
        return $this->disabledKeys ??= ModuleSetting::query()
            ->where('is_enabled', false)
            ->pluck('key')
            ->all();
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
     * Drop the memoized platform-disabled state. Registered as a singleton, so
     * anything that writes ModuleSetting must call this — otherwise a toggle
     * would not take effect until the next process (e.g. the next request in
     * normal PHP-FPM, but not within a single long-lived process).
     */
    public function flushDisabledState(): void
    {
        $this->disabledKeys = null;
    }

    /**
     * The Vite entrypoint for an Inertia page, so the root view can preload it.
     *
     * Mirrors the resolution order in resources/js/app.tsx: for a page under
     * Modules/<Name>/, the module's own copy wins and core is the fallback, since
     * modules are extracted one at a time and both may be live at once. The lookup
     * is by directory name rather than module key — the page namespace is what
     * app.tsx matches on, and a module is free to render pages it does not own.
     */
    public function pageEntrypoint(string $component): string
    {
        $core = "resources/js/Pages/{$component}.tsx";

        if (! preg_match('#^Modules/([^/]+)/#', $component, $matches)) {
            return $core;
        }

        $owned = "modules/{$matches[1]}/resources/js/Pages/{$component}.tsx";

        return file_exists(base_path($owned)) ? $owned : $core;
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
