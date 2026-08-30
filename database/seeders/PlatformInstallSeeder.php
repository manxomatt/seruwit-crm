<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

/**
 * Production-safe platform bootstrap: everything the central control plane needs
 * to run, and nothing operator-specific.
 *
 * User-independent only — it never plants accounts, demo data, or owned content.
 * Landing pages need an owner, so they are NOT seeded here (they would run before
 * the admin exists during install and violate the pages.user_id foreign key);
 * CentralLandingPagesSeeder handles them once a user exists. The first-run
 * installer calls this directly (App\Actions\Install\CentralMigrator).
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
            PlatformSettingSeeder::class,
            // Central only: plans are a platform definition, and tenant schemas
            // carry nothing but the plan key.
            PlanSeeder::class,
            SubscriptionTierSeeder::class,
        ]);
    }
}
