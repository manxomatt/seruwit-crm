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
        foreach (Permission::getModules() as $moduleSlug => $moduleName) {
            $actions = $moduleSlug === 'accounting'
                ? Permission::ACCOUNTING_ACTIONS
                : Permission::getActions();

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
