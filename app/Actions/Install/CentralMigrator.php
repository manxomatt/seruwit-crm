<?php

namespace App\Actions\Install;

use Database\Seeders\PlatformInstallSeeder;
use Illuminate\Support\Facades\Artisan;
use RuntimeException;

/**
 * Builds the central schema and its platform bootstrap during installation:
 * central migrations, then PlatformInstallSeeder. Deliberately scoped to central
 * only — no tenant migrations and no module installs; tenants and modules are
 * provisioned later, per workspace.
 */
class CentralMigrator
{
    /**
     * @throws RuntimeException when migration or seeding fails
     */
    public function run(): void
    {
        if (Artisan::call('migrate', ['--force' => true]) !== 0) {
            throw new RuntimeException('Central migration failed: '.Artisan::output());
        }

        if (Artisan::call('db:seed', ['--class' => PlatformInstallSeeder::class, '--force' => true]) !== 0) {
            throw new RuntimeException('Platform seeding failed: '.Artisan::output());
        }
    }
}
