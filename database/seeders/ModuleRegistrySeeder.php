<?php

namespace Database\Seeders;

use App\Models\Menu;
use App\Models\Permission;
use App\Modules\Facades\Modules;
use Illuminate\Database\Seeder;

/**
 * Seeds permissions and menus for every registered module.
 *
 * The central database runs all modules — nothing there is per-tenant installable
 * — so it needs the rows that a tenant would otherwise get from modules:install.
 * Deliberately not part of TenantDatabaseSeeder: a tenant only gets a module's
 * permissions and menu when it actually installs it.
 */
class ModuleRegistrySeeder extends Seeder
{
    public function run(): void
    {
        foreach (Modules::all() as $module) {
            foreach ($module->permissions() as $action) {
                $actionName = Permission::ACTIONS[$action] ?? ucfirst($action);

                Permission::query()->firstOrCreate(
                    ['module' => $module->key(), 'action' => $action],
                    [
                        'name' => "{$actionName} {$module->label()}",
                        'slug' => Permission::generateSlug($module->key(), $action),
                        'description' => "Allows {$actionName} operation on {$module->label()}",
                    ],
                );
            }

            if ($menu = $module->menu()) {
                Menu::query()->updateOrCreate(['slug' => $menu['slug']], $menu);
            }
        }
    }
}
