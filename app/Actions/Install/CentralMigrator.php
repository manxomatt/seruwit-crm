<?php

namespace App\Actions\Install;

use App\Modules\Facades\Modules;
use Database\Seeders\PlatformInstallSeeder;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\File;
use RuntimeException;

/**
 * Builds the central schema and its platform bootstrap during installation:
 * central migrations, the central-facing module tables, then PlatformInstallSeeder.
 * Deliberately scoped to central only — no tenant migrations and no per-tenant
 * module installs; tenants and modules are provisioned later, per workspace.
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

        $this->migrateCentralModules();

        if (Artisan::call('db:seed', ['--class' => PlatformInstallSeeder::class, '--force' => true]) !== 0) {
            throw new RuntimeException('Platform seeding failed: '.Artisan::output());
        }
    }

    /**
     * Migrate the registered modules the central admin exposes (Contents, etc.),
     * regardless of the deployment profile.
     *
     * The base migrate above only auto-loads registered-module migrations when
     * CENTRAL_SERVES_APP is true, so a production (thin control plane) install would
     * otherwise leave central without tables it genuinely needs — e.g. `pages`,
     * which the central homepage reads. Migrating each module by path here is
     * idempotent (Laravel skips migrations already run, so development installs are
     * a no-op) and safe: these modules' foreign keys point only at their own tables
     * or at core central tables (users, media) that the base migrate already made.
     *
     * @throws RuntimeException when a module migration fails
     */
    private function migrateCentralModules(): void
    {
        foreach (config('modules.central_modules', []) as $key) {
            // Only registered modules carry their own migrations under modules/*;
            // core features and platform pseudo-modules (settings, tenants, …) come
            // from the central migrations already run above.
            if (! Modules::has($key)) {
                continue;
            }

            $path = Modules::find($key)->migrationsPath();

            if (! File::isDirectory($path)) {
                continue;
            }

            $exitCode = Artisan::call('migrate', [
                '--path' => $path,
                '--realpath' => true,
                '--force' => true,
            ]);

            if ($exitCode !== 0) {
                throw new RuntimeException("Central module [{$key}] migration failed: ".Artisan::output());
            }
        }
    }
}
