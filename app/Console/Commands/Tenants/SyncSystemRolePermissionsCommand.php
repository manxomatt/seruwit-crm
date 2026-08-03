<?php

namespace App\Console\Commands\Tenants;

use App\Models\Tenant;
use App\Support\SystemRolePermissions;
use Illuminate\Console\Command;

/**
 * Backfill system-role permission pivots after modules were installed without
 * syncing Administrator (and other system roles) to newly seeded permissions.
 *
 * Idempotent — preserves extras an admin already added beyond the defaults.
 */
class SyncSystemRolePermissionsCommand extends Command
{
    protected $signature = 'tenants:sync-system-role-permissions {--tenant= : Limit to a single tenant id}';

    protected $description = 'Sync locked default permissions onto system roles for existing tenants';

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
                SystemRolePermissions::syncAllSystemRoles();
                $this->line("  {$tenant->id}: synced system role permissions");
            });
        }

        $this->info("Synced system role permissions for {$tenants->count()} tenant(s).");

        return self::SUCCESS;
    }
}
