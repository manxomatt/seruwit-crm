<?php

namespace App\Console\Commands;

use App\Models\InstalledModule;
use App\Models\Tenant;
use App\Modules\Facades\Modules;
use App\Modules\ModuleInstaller;
use Illuminate\Console\Command;
use Throwable;

/**
 * Applies module migrations added since a tenant installed the module.
 *
 * A module's migrations only run when it is installed into a tenant, so a
 * migration added to an already-installed module never reaches the tenants that
 * installed it earlier — they are left with a stale schema until something like
 * a missing table surfaces at runtime. This walks every installed module in
 * every tenant and runs its pending migrations.
 *
 * Idempotent: Laravel skips migrations already recorded, so a tenant that is
 * fully up to date is untouched. Belongs in the deploy pipeline, after code is
 * shipped, the same way tenants:migrate handles the core tenant migrations.
 */
class ModulesMigrate extends Command
{
    protected $signature = 'modules:migrate
                            {--tenant= : Limit to a single tenant id}
                            {--pretend : List pending migrations without running them}';

    protected $description = 'Run module migrations that postdate each tenant\'s install of the module';

    public function handle(ModuleInstaller $installer): int
    {
        $modules = Modules::all();

        if ($modules === []) {
            $this->info('No optional modules are registered.');

            return self::SUCCESS;
        }

        $tenants = Tenant::query()
            ->when($this->option('tenant'), fn ($query, $id) => $query->whereKey($id))
            ->get();

        if ($tenants->isEmpty()) {
            $this->warn('No tenants matched.');

            return self::SUCCESS;
        }

        $migrated = 0;
        $failed = 0;

        foreach ($tenants as $tenant) {
            foreach ($modules as $key => $module) {
                try {
                    $ran = $tenant->run(function () use ($installer, $module, $key, $tenant): int {
                        // Only installed modules: an uninstalled one keeps its
                        // tables for the grace period, but re-migrating it would
                        // resurrect a schema the tenant chose to retire.
                        $installed = InstalledModule::query()
                            ->where('key', $key)
                            ->installed()
                            ->exists();

                        if (! $installed) {
                            return 0;
                        }

                        $pending = $installer->pendingMigrations($module);

                        if ($pending === []) {
                            return 0;
                        }

                        if ($this->option('pretend')) {
                            foreach ($pending as $migration) {
                                $this->line("  {$tenant->id}: would run [{$key}] {$migration}");
                            }

                            return count($pending);
                        }

                        $installer->migrate($module);

                        foreach ($pending as $migration) {
                            $this->line("  {$tenant->id}: ran [{$key}] {$migration}");
                        }

                        return count($pending);
                    });

                    $migrated += $ran;
                } catch (Throwable $e) {
                    $this->error("  {$tenant->id}: migrating [{$key}] failed — {$e->getMessage()}");
                    $failed++;
                }
            }
        }

        $verb = $this->option('pretend') ? 'Would run' : 'Ran';
        $this->info("{$verb} {$migrated} pending module migration(s) across {$tenants->count()} tenant(s).");

        return $failed > 0 ? self::FAILURE : self::SUCCESS;
    }
}
