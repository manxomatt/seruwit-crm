<?php

namespace App\Console\Commands;

use App\Models\Tenant;
use App\Modules\ModuleCatalog;
use Illuminate\Console\Command;

class ModulesList extends Command
{
    protected $signature = 'modules:list {tenant : The tenant id}';

    protected $description = 'Show which optional modules a tenant is entitled to and has installed';

    public function handle(ModuleCatalog $catalog): int
    {
        $tenant = Tenant::query()->find($this->argument('tenant'));

        if (! $tenant) {
            $this->error("Tenant [{$this->argument('tenant')}] not found.");

            return self::FAILURE;
        }

        // Same view-model the two catalog UIs render, so the CLI can never
        // disagree with them about what state a module is in.
        $modules = $catalog->forTenant($tenant);

        $plan = $catalog->planFor($tenant);
        $this->line("Plan: {$plan['label']} ({$plan['key']})");

        if ($modules === []) {
            $this->info('No optional modules are registered.');

            return self::SUCCESS;
        }

        $rows = [];

        foreach ($modules as $module) {
            $rows[] = [
                $module['key'],
                $module['label'],
                $this->describeState($module),
            ];
        }

        $this->table(['Key', 'Module', 'State'], $rows);

        return self::SUCCESS;
    }

    /**
     * @param  array<string, mixed>  $module
     */
    private function describeState(array $module): string
    {
        return match ($module['state']) {
            'installed' => 'installed',
            'available' => 'available',
            'uninstalled' => 'uninstalled (purges '.$module['purges_at'].')',
            'locked_with_data' => 'locked by plan (installed, data kept)',
            default => 'locked by plan',
        };
    }
}
