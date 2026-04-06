<?php

namespace Database\Seeders;

use App\Models\Permission;
use Illuminate\Database\Seeder;

class PermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $modules = Permission::getModules();
        $actions = Permission::getActions();

        foreach ($modules as $moduleSlug => $moduleName) {
            foreach ($actions as $actionSlug => $actionName) {
                Permission::query()->firstOrCreate(
                    [
                        'module' => $moduleSlug,
                        'action' => $actionSlug,
                    ],
                    [
                        'name' => Permission::generateName($moduleSlug, $actionSlug),
                        'slug' => Permission::generateSlug($moduleSlug, $actionSlug),
                        'description' => "Allows {$actionName} operation on {$moduleName}",
                    ]
                );
            }
        }
    }
}
