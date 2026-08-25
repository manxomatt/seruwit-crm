<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

/**
 * Production-safe platform bootstrap: everything the central control plane needs
 * to run, and nothing operator-specific.
 *
 * The first-run installer calls this directly (App\Actions\Install\CentralMigrator),
 * so it must never plant default accounts or demo data — the real admin comes from
 * the installer's Create Admin step. DatabaseSeeder pairs it with DevAccountsSeeder
 * for local/test convenience.
 */
class PlatformInstallSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        // Permissions first — including every registered module's, since RoleSeeder
        // syncs whatever exists at that moment onto the roles — then roles, menus
        // and settings.
        $this->call([
            PermissionSeeder::class,
            ModuleRegistrySeeder::class,
            RoleSeeder::class,
            MenuSeeder::class,
            SettingSeeder::class,
            // Central only: plans are a platform definition, and tenant schemas
            // carry nothing but the plan key.
            PlanSeeder::class,
            SubscriptionTierSeeder::class,
            CreateCentralLandingPageSeeder::class,
            CreateCentralLandingPageBrightSeeder::class,
            CreateRentalManagementLandingSeeder::class,
            CreateSeruwitBizLandingSeeder::class,
            CreateSeruwitBizAltLandingSeeder::class,
            CreateSeruwitElevateLandingSeeder::class,
        ]);
    }
}
