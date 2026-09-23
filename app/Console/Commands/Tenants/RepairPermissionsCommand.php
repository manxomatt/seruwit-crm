<?php

namespace App\Console\Commands\Tenants;

use App\Models\Tenant;
use App\Support\PermissionRepair;
use Illuminate\Console\Command;

class RepairPermissionsCommand extends Command
{
    protected $signature = 'tenants:repair-permissions
                            {--tenant= : Limit to a single tenant id}
                            {--central : Run repair on the central database}
                            {--all : Run repair on central and all tenants}';

    protected $description = 'Clean up invalid/bloated permissions across modules and re-sync system roles';

    public function handle(): int
    {
        $runCentral = $this->option('central') || $this->option('all');
        $runTenants = ! $this->option('central') || $this->option('all');

        if ($runCentral) {
            $this->info('Repairing central database permissions...');
            $result = PermissionRepair::repair();
            $this->line("  Central: {$result['deleted']} deleted, {$result['updated']} updated, {$result['remaining']} remaining.");
        }

        if ($runTenants) {
            $tenants = Tenant::query()
                ->when($this->option('tenant'), fn ($query, $id) => $query->whereKey($id))
                ->get();

            if ($tenants->isEmpty() && ! $runCentral) {
                $this->warn('No tenants matched.');

                return self::SUCCESS;
            }

            foreach ($tenants as $tenant) {
                $tenant->run(function () use ($tenant): void {
                    $result = PermissionRepair::repair();
                    $this->line("  Tenant [{$tenant->id}]: {$result['deleted']} deleted, {$result['updated']} updated, {$result['remaining']} remaining.");
                });
            }

            $this->info("Completed permission repair for {$tenants->count()} tenant(s).");
        }

        return self::SUCCESS;
    }
}
