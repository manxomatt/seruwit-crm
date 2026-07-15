<?php

namespace App\Console\Commands;

use App\Models\Tenant;
use App\Modules\Facades\Modules;
use App\Modules\ModuleInstaller;
use Illuminate\Console\Command;
use RuntimeException;

class ModulesInstall extends Command
{
    protected $signature = 'modules:install {tenant : The tenant id} {module : The module key}';

    protected $description = 'Install a module into a tenant, restoring its data if it was previously uninstalled';

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
            $installer->install($tenant, $module);
        } catch (RuntimeException $e) {
            $this->error($e->getMessage());

            return self::FAILURE;
        }

        $this->info("Installed [{$module->key()}] into tenant [{$tenant->id}].");

        return self::SUCCESS;
    }
}
