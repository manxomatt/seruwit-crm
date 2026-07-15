<?php

namespace App\Console\Commands;

use App\Models\InstalledModule;
use App\Models\Tenant;
use App\Modules\Facades\Modules;
use Illuminate\Console\Command;

class ModulesList extends Command
{
    protected $signature = 'modules:list {tenant : The tenant id}';

    protected $description = 'Show which optional modules a tenant has installed';

    public function handle(): int
    {
        $tenant = Tenant::query()->find($this->argument('tenant'));

        if (! $tenant) {
            $this->error("Tenant [{$this->argument('tenant')}] not found.");

            return self::FAILURE;
        }

        $modules = Modules::all();

        if ($modules === []) {
            $this->info('No optional modules are registered.');

            return self::SUCCESS;
        }

        // Rendered inside the tenant context: these records are pinned to the
        // tenant connection, and casting uninstalled_at reaches for that
        // connection's query grammar — which no longer resolves once tenancy ends.
        $rows = $tenant->run(function () use ($modules): array {
            $states = InstalledModule::query()->get()->keyBy('key');
            $graceDays = config('modules.purge_after_days');

            $rows = [];

            foreach ($modules as $key => $module) {
                $state = $states->get($key);

                $rows[] = [
                    $key,
                    $module->label(),
                    match (true) {
                        $state === null => 'available',
                        $state->isInstalled() => 'installed',
                        default => 'uninstalled (purges '.$state->uninstalled_at
                            ->addDays($graceDays)
                            ->toDateString().')',
                    },
                ];
            }

            return $rows;
        });

        $this->table(['Key', 'Module', 'State'], $rows);

        return self::SUCCESS;
    }
}
