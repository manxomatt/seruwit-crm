<?php

namespace App\Console\Commands;

use App\Models\Tenant;
use App\Modules\Facades\Modules;
use App\Modules\ModuleInstaller;
use Illuminate\Console\Command;
use RuntimeException;

class ModulesUninstall extends Command
{
    protected $signature = 'modules:uninstall {tenant : The tenant id} {module : The module key}';

    protected $description = 'Withdraw a module from a tenant, keeping its data until the purge grace period lapses';

    public function handle(ModuleInstaller $installer): int
    {
        $tenant = Tenant::query()->find($this->argument('tenant'));

        if (! $tenant) {
            $this->error("Tenant [{$this->argument('tenant')}] not found.");

            return self::FAILURE;
        }

        $module = Modules::find($this->argument('module'));

        if (! $module) {
            $this->error("Module [{$this->argument('module')}] is not registered.");

            return self::FAILURE;
        }

        try {
            $installer->uninstall($tenant, $module);
        } catch (RuntimeException $e) {
            $this->error($e->getMessage());

            return self::FAILURE;
        }

        $days = config('modules.purge_after_days');

        $this->info("Uninstalled [{$module->key()}] from tenant [{$tenant->id}].");
        $this->line("Its data is kept for {$days} days; reinstalling before then restores it.");

        return self::SUCCESS;
    }
}
