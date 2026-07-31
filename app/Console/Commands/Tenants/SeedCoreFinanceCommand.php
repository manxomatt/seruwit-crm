<?php

namespace App\Console\Commands\Tenants;

use App\Models\InstalledModule;
use App\Models\Tenant;
use Database\Seeders\MenuSeeder;
use Database\Seeders\PermissionSeeder;
use Database\Seeders\RoleSeeder;
use Illuminate\Console\Command;

/**
 * Backfill permissions, menus, and role sync for core finance (partners + accounting).
 *
 * Run after deploying core migrations: `php artisan tenants:migrate` then this command.
 * Idempotent. Also clears obsolete installed_modules rows for those keys.
 */
class SeedCoreFinanceCommand extends Command
{
    protected $signature = 'tenants:seed-core-finance {--tenant= : Limit to a single tenant id}';

    protected $description = 'Seed partners/accounting permissions and menus for existing tenants';

    public function handle(): int
    {
        $tenants = Tenant::query()
            ->when($this->option('tenant'), fn ($query, $id) => $query->whereKey($id))
            ->get();

        if ($tenants->isEmpty()) {
            $this->warn('No tenants matched.');

            return self::SUCCESS;
        }

        foreach ($tenants as $tenant) {
            $tenant->run(function () use ($tenant): void {
                (new PermissionSeeder)->run();
                (new RoleSeeder)->run();
                (new MenuSeeder)->run();

                InstalledModule::query()
                    ->whereIn('key', ['partners', 'accounting'])
                    ->delete();

                $this->line("  {$tenant->id}: seeded core finance permissions/menus");
            });
        }

        $this->info("Seeded core finance for {$tenants->count()} tenant(s).");

        return self::SUCCESS;
    }
}
