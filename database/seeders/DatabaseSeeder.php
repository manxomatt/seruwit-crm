<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database for local development and tests: the same
     * platform bootstrap the installer runs, then the dev/test-only accounts.
     * A real deployment runs PlatformInstallSeeder alone (via the installer) and
     * never seeds DevAccountsSeeder.
     */
    public function run(): void
    {
        $this->call([
            PlatformInstallSeeder::class,
            DevAccountsSeeder::class,
        ]);
    }
}
