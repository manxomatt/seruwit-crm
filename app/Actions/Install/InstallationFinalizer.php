<?php

namespace App\Actions\Install;

use App\Support\Installer\InstallState;
use Database\Seeders\CentralLandingPagesSeeder;
use Illuminate\Support\Facades\Artisan;

/**
 * Seals installation: seeds the owned starter content now that the admin exists,
 * writes the install lock (which closes the installer for good), and then,
 * optionally, caches configuration so the freshly written .env is baked in for
 * production.
 *
 * Only config is cached — not routes — because the app registers closure routes
 * that route:cache cannot serialize. $optimize is skipped in tests so the suite
 * never writes a real config cache or lock side effects it must undo.
 */
class InstallationFinalizer
{
    public function finalize(bool $optimize = true): void
    {
        // Central landing pages are owned content: seed them here, after the admin
        // was created, so pages.user_id references a real user. Idempotent, and a
        // no-op when no user exists yet.
        Artisan::call('db:seed', ['--class' => CentralLandingPagesSeeder::class, '--force' => true]);

        InstallState::markInstalled();

        if ($optimize) {
            Artisan::call('config:cache');
        }
    }
}
