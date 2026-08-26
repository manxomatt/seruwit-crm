<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

/**
 * Central marketing landing pages, seeded as rows in the `pages` table.
 *
 * These are owned content: each page needs a `user_id`, so this must run only
 * after at least one user exists — after DevAccountsSeeder in local seeding, and
 * after the admin is created in the installer (InstallationFinalizer). The
 * individual seeders also skip themselves when no user is present, as a guard.
 */
class CentralLandingPagesSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        $this->call([
            CreateCentralLandingPageSeeder::class,
            CreateCentralLandingPageBrightSeeder::class,
            CreateRentalManagementLandingSeeder::class,
            CreateSeruwitBizLandingSeeder::class,
            CreateSeruwitBizAltLandingSeeder::class,
            CreateSeruwitElevateLandingSeeder::class,
        ]);
    }
}
