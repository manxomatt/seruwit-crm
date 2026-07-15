<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class TenantDatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed a freshly provisioned tenant schema.
     *
     * Users are intentionally not seeded here: the workspace owner is synced
     * into the schema via resource syncing when their pivot record is created.
     */
    public function run(): void
    {
        $this->call([
            PermissionSeeder::class,
            RoleSeeder::class,
            MenuSeeder::class,
            SettingSeeder::class,
        ]);
    }
}
