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
     * Installed module keys on the central schema, memoized for the request.
     * Separate from the per-tenant map since central is not a tenant.
     *
     * @var list<string>|null
     */
    private ?array $centralInstalledKeys = null;

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

    /**
     * Core feature modules that still ship as ModuleContract classes (routes/boot)
     * but are not installable — migrations live under database/migrations/tenant.
     *
     * @return array<string, ModuleContract>
     */
    public function core(): array
    {
        $modules = [];

        foreach (config('modules.core', []) as $class) {
            $module = app($class);
            $modules[$module->key()] = $module;
        }

        return $modules;
    }

    public function find(string $key): ?ModuleContract
    {
        return $this->all()[$key] ?? $this->core()[$key] ?? null;
    }

    /**
     * @return list<string>
     */
    public function centralModules(): array
    {
        return config('modules.central_modules', []);
    }

    public function isCentralModule(string $key): bool
    {
        return in_array($key, $this->centralModules(), true);
    }

    /**
     * Optional modules the super admin may install onto the central dashboard,
     * the single source of truth for the marketplace, its routes and the sidebar.
     *
     * config('modules.central_installable') is either the string 'all' — every
     * registered module, so central mirrors what a tenant can install — or an
     * explicit array of keys to curate. The always-on central modules are always
     * excluded: they are provisioned already and need no install.
     *
     * @return list<string>
     */
    public function centralInstallable(): array
    {
        $configured = config('modules.central_installable', 'all');

        $keys = $configured === 'all'
            ? array_keys($this->all())
            : array_values(array_intersect((array) $configured, array_keys($this->all())));

        return array_values(array_diff($keys, $this->centralModules()));
    }

    /**
     * Whether $key names a module the super admin may install onto central.
     */
    public function isCentralInstallable(string $key): bool
    {
        return in_array($key, $this->centralInstallable(), true);
    }

    /**
     * Modules actually installed on (or built into) the central dashboard right
     * now: the always-on central modules plus whatever the super admin has
     * installed from the marketplace. This is what the central sidebar lists,
     * as opposed to centralInstallable() — the full catalogue of what *may* be
     * installed. Deliberately independent of central_serves_app: menu curation
     * follows real install state even when that dev flag makes every module
     * route reachable.
     *
     * @return list<string>
     */
    public function centralInstalled(): array
    {
        return array_values(array_unique([
            ...$this->centralModules(),
            ...$this->installedKeysForCentral(),
        ]));
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
     * Whether the module's tables exist in the current schema.
     *
     * Fails open for core features: anything not a registered module is core and
     * always present — that is what keeps the guards correct while modules are
     * still being extracted one by one. Off the tenant connection the answer comes
     * from central install state (see installedOnCentral), so the central admin
     * can carry an optional module à la carte without every module dark-firing.
     */
    public function installed(string $key): bool
    {
        if (! $this->has($key)) {
            return true;
        }

        if (! tenancy()->initialized) {
            return $this->installedOnCentral($key);
        }

        return in_array($key, $this->installedKeysForCurrentTenant(), true);
    }

    /**
     * Whether $key is present on the central schema.
     *
     * When central serves the whole app (dev), every module's tables come from a
     * plain migrate, so treat all as present. Always-on central modules
     * (config('modules.central_modules')) are provisioned by CentralMigrator
     * without an installed_modules row, so they are present too. Everything else
     * is an optional module the super admin installs on demand, tracked in the
     * central installed_modules table exactly like a tenant install.
     */
    private function installedOnCentral(string $key): bool
    {
        if (config('app.central_serves_app')) {
            return true;
        }

        if ($this->isCentralModule($key)) {
            return true;
        }

        return in_array($key, $this->installedKeysForCentral(), true);
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
     * Installed optional-module keys on the central schema, memoized for the
     * request. Fails closed when the table is absent (mid-migration) so a not-yet
     * provisioned central never dark-fires an optional module as present — the
     * always-on central modules are already short-circuited before this runs.
     *
     * @return list<string>
     */
    private function installedKeysForCentral(): array
    {
        if ($this->centralInstalledKeys !== null) {
            return $this->centralInstalledKeys;
        }

        if (! Schema::hasTable('installed_modules')) {
            return $this->centralInstalledKeys = [];
        }

        return $this->centralInstalledKeys = InstalledModule::query()
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
        $this->centralInstalledKeys = null;
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
     * Register core feature module routes (no requires-module gate), then every
     * optional module behind its own requires-module middleware.
     */
    public function registerRoutes(): void
    {
        foreach ($this->core() as $module) {
            $module->routes();
        }

        foreach ($this->all() as $module) {
            Route::middleware('requires-module:'.$module->key())
                ->group(fn () => $module->routes());
        }
    }
}
