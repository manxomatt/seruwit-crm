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
        $module = Modules::find('fleet-fuel');
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

        // 4. Ensure Installed for tenants with fleet module
        $hasFleet = InstalledModule::query()
            ->where('key', 'fleet')
            ->installed()
            ->exists();

        if ($hasFleet) {
            if (! InstalledModule::query()->where('key', 'fleet-fuel')->exists()) {
                InstalledModule::query()->create([
                    'key' => 'fleet-fuel',
                    'installed_at' => now(),
                    'uninstalled_at' => null,
                ]);
            }
        }

        Modules::flushInstalledState();
    }

    public function down(): void
    {
        // Non-destructive: leave records intact
    }
};
