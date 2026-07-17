<?php

namespace App\Modules;

use App\Models\InstalledModule;
use App\Models\Menu;
use App\Models\Permission;
use App\Models\Tenant;
use App\Modules\Facades\Modules;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\File;
use RuntimeException;

/**
 * Installs and uninstalls modules within a tenant's schema.
 *
 * Every step is individually idempotent and safe to re-run: tenant provisioning
 * deliberately runs outside a transaction (its DDL is issued on a separate
 * connection), so there is no rollback to lean on if a step fails halfway.
 */
class ModuleInstaller
{
    /**
     * Create the module's tables, permissions and menu inside $tenant. Any
     * registered module it requires but does not yet have is installed first,
     * recursively — so installing Transportation alone also brings in Fleet.
     *
     * @throws RuntimeException when the tenant's plan does not cover the module
     *                          or any module it transitively requires
     */
    public function install(Tenant $tenant, ModuleContract $module): void
    {
        $tenant->run(function () use ($tenant, $module): void {
            $this->installWithinTenant($tenant, $module);
        });
    }

    /**
     * Does the actual install work, assuming tenant context is already active.
     * Recursion for a missing requirement calls back into this directly rather
     * than through install(), since Tenant::run() is not meant to be re-entered.
     */
    private function installWithinTenant(Tenant $tenant, ModuleContract $module): void
    {
        if (! $tenant->isEntitledTo($module->key())) {
            throw new RuntimeException(
                "Plan [{$tenant->planKey()}] does not include module [{$module->key()}].",
            );
        }

        foreach ($module->requires() as $requiredKey) {
            // Unregistered dependencies are core features that ship with every
            // tenant, so only registered ones need installing.
            if (! Modules::has($requiredKey)) {
                continue;
            }

            $satisfied = InstalledModule::query()
                ->where('key', $requiredKey)
                ->installed()
                ->exists();

            if (! $satisfied) {
                $this->installWithinTenant($tenant, Modules::find($requiredKey));
            }
        }

        Artisan::call('migrate', [
            '--path' => $module->migrationsPath(),
            '--realpath' => true,
            '--force' => true,
        ]);

        $this->seedPermissions($module);
        $this->seedMenu($module);

        InstalledModule::query()->updateOrCreate(
            ['key' => $module->key()],
            ['installed_at' => now(), 'uninstalled_at' => null],
        );

        Modules::flushInstalledState();
    }

    /**
     * Withdraw the module from $tenant without touching its tables or data, so a
     * reinstall restores everything. Permissions are left alone on purpose:
     * RoleSeeder syncs them back wholesale on any re-seed, so revoking here would
     * be a second source of truth that silently heals itself.
     *
     * @throws RuntimeException when another installed module depends on this one
     */
    public function uninstall(Tenant $tenant, ModuleContract $module): void
    {
        $tenant->run(function () use ($module): void {
            $this->guardDependents($module);

            if ($menu = $module->menu()) {
                Menu::query()->where('slug', $menu['slug'])->update(['is_active' => false]);
            }

            InstalledModule::query()->updateOrCreate(
                ['key' => $module->key()],
                ['installed_at' => now(), 'uninstalled_at' => now()],
            );

            Modules::flushInstalledState();
        });
    }

    /**
     * Destroy a module's tables and data in the current schema, for good.
     *
     * Uses migrate:reset rather than migrate:rollback because rollback only walks
     * the last batch, and a module installed after provisioning sits in a batch of
     * its own. reset with --path is batch-agnostic and silently skips every ran
     * migration whose file is not under that path.
     *
     * @throws RuntimeException when the migrations fail to roll back
     */
    public function purge(ModuleContract $module): void
    {
        $exitCode = Artisan::call('migrate:reset', [
            '--path' => $module->migrationsPath(),
            '--realpath' => true,
            '--force' => true,
        ]);

        if ($exitCode !== 0) {
            throw new RuntimeException(
                "Rolling back [{$module->key()}] failed: ".Artisan::output(),
            );
        }

        Permission::query()->where('module', $module->key())->delete();

        if ($menu = $module->menu()) {
            Menu::query()->where('slug', $menu['slug'])->delete();
        }

        InstalledModule::query()->where('key', $module->key())->delete();

        Modules::flushInstalledState();
    }

    /**
     * Whether $module is currently installed in $tenant.
     */
    public function isInstalled(Tenant $tenant, ModuleContract $module): bool
    {
        return $tenant->run(fn (): bool => InstalledModule::query()
            ->where('key', $module->key())
            ->installed()
            ->exists());
    }

    /**
     * Whether the module's tables already exist in the current schema, inferred
     * from its migrations having run.
     *
     * This is how tenants provisioned before the module system can be recognised:
     * their carousel tables were created by the core tenant migrations, and since
     * Laravel records migrations by basename only, relocating those files into the
     * module leaves the existing records matching.
     */
    public function hasRunMigrations(ModuleContract $module): bool
    {
        $migrations = collect(File::glob($module->migrationsPath().'/*.php'))
            ->map(fn (string $path): string => str_replace('.php', '', basename($path)));

        if ($migrations->isEmpty()) {
            return false;
        }

        $ran = app('migration.repository')->getRan();

        return $migrations->every(fn (string $migration): bool => in_array($migration, $ran, true));
    }

    /**
     * Record a module as installed without running its migrations or seeders,
     * for tenants that already have it from before the module system existed.
     */
    public function markInstalled(ModuleContract $module): void
    {
        InstalledModule::query()->updateOrCreate(
            ['key' => $module->key()],
            ['installed_at' => now(), 'uninstalled_at' => null],
        );

        Modules::flushInstalledState();
    }

    private function guardDependents(ModuleContract $module): void
    {
        foreach (Modules::all() as $candidate) {
            if (! in_array($module->key(), $candidate->requires(), true)) {
                continue;
            }

            $isInstalled = InstalledModule::query()
                ->where('key', $candidate->key())
                ->installed()
                ->exists();

            if ($isInstalled) {
                throw new RuntimeException(
                    "Module [{$module->key()}] cannot be uninstalled while [{$candidate->key()}] depends on it.",
                );
            }
        }
    }

    /**
     * Names are built from the module's own label rather than
     * Permission::generateName(), which resolves against Permission::MODULES —
     * a list an extracted module is by definition no longer in.
     */
    private function seedPermissions(ModuleContract $module): void
    {
        foreach ($module->permissions() as $action) {
            $actionName = Permission::ACTIONS[$action] ?? ucfirst($action);

            Permission::query()->firstOrCreate(
                ['module' => $module->key(), 'action' => $action],
                [
                    'name' => "{$actionName} {$module->label()}",
                    'slug' => Permission::generateSlug($module->key(), $action),
                    'description' => "Allows {$actionName} operation on {$module->label()}",
                ],
            );
        }
    }

    private function seedMenu(ModuleContract $module): void
    {
        if (! $menu = $module->menu()) {
            return;
        }

        Menu::query()->updateOrCreate(
            ['slug' => $menu['slug']],
            [...$menu, 'is_active' => true],
        );
    }
}
