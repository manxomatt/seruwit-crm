<?php

use App\Models\InstalledModule;
use App\Models\Menu;
use App\Models\Permission;
use App\Modules\Facades\Modules;
use App\Support\SystemRolePermissions;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        $hasRental = InstalledModule::query()
            ->where('key', 'rental')
            ->installed()
            ->exists();

        if ($hasRental) {
            $moduleKey = 'rental-storefront';
            if (! InstalledModule::query()->where('key', $moduleKey)->exists()) {
                InstalledModule::query()->create([
                    'key' => $moduleKey,
                    'installed_at' => now(),
                    'uninstalled_at' => null,
                ]);
            }
        }

        $module = Modules::find('rental-storefront');
        if (! $module) {
            return;
        }

        // 1. Seed Permissions
        foreach ($module->permissions() as $action) {
            $actionName = Permission::getActions()[$action] ?? ucfirst(str_replace('_', ' ', $action));

            Permission::query()->firstOrCreate(
                ['module' => $module->key(), 'action' => $action],
                [
                    'name' => "{$actionName} {$module->label()}",
                    'slug' => Permission::generateSlug($module->key(), $action),
                    'description' => "Allows {$actionName} operation on {$module->label()}",
                ],
            );
        }

        // 2. Seed Roles & Sync
        SystemRolePermissions::seedRolesForModule($module->key());
        SystemRolePermissions::syncAllSystemRoles();

        // 3. Seed Menu
        if ($menu = $module->menu()) {
            Menu::query()->updateOrCreate(['slug' => $menu['slug']], $menu);
        }

        Modules::flushInstalledState();
    }

    public function down(): void
    {
        // Keep data intact on rollback
    }
};
