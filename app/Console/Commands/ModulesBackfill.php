<?php

namespace App\Console\Commands;

use App\Models\InstalledModule;
use App\Models\Tenant;
use App\Modules\Facades\Modules;
use App\Modules\ModuleInstaller;
use Illuminate\Console\Command;

/**
 * Records modules that tenants already have from before the module system.
 *
 * Idempotent, and safe to run at any point: it only ever marks a module installed
 * where its tables demonstrably already exist, and skips tenants that already have
 * an explicit state — so a tenant that deliberately uninstalled stays uninstalled.
 */
class ModulesBackfill extends Command
{
    protected $signature = 'modules:backfill {--tenant= : Limit to a single tenant id}';

    protected $description = 'Mark pre-existing modules as installed for tenants provisioned before the module system';

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

        $marked = 0;

        foreach ($tenants as $tenant) {
            $marked += $tenant->run(function () use ($tenant, $modules, $installer): int {
                $count = 0;

                foreach ($modules as $key => $module) {
                    if (InstalledModule::query()->where('key', $key)->exists()) {
                        continue;
                    }

                    if (! $installer->hasRunMigrations($module)) {
                        continue;
                    }

                    $installer->markInstalled($module);
                    $this->line("  {$tenant->id}: marked [{$key}] installed");
                    $count++;
                }

                return $count;
            });
        }

        $this->info("Backfilled {$marked} module state(s) across {$tenants->count()} tenant(s).");

        return self::SUCCESS;
    }
}
