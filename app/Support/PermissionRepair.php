<?php

namespace App\Support;

use App\Models\InstalledModule;
use App\Models\Permission;
use App\Modules\Facades\Modules;
use Illuminate\Support\Facades\Schema;

class PermissionRepair
{
    /**
     * Repair permissions for the current schema context (tenant or central).
     *
     * @return array{deleted: int, updated: int, remaining: int}
     */
    public static function repair(): array
    {
        if (! Schema::hasTable('permissions')) {
            return ['deleted' => 0, 'updated' => 0, 'remaining' => 0];
        }

        $validModuleActions = [];

        // 1. Core modules and their valid actions
        foreach (Permission::MODULES as $moduleKey => $moduleName) {
            $validModuleActions[$moduleKey] = array_keys(Permission::defaultActionsFor($moduleKey));
        }

        // 2. If registered modules exist and are installed (or on central), include their valid actions
        if (class_exists(Modules::class)) {
            $isTenant = tenancy()->initialized;
            $installedKeys = $isTenant && Schema::hasTable('installed_modules')
                ? InstalledModule::query()->installed()->pluck('key')->all()
                : array_keys(Modules::all());

            foreach (Modules::all() as $module) {
                if (! $isTenant || in_array($module->key(), $installedKeys, true)) {
                    $validModuleActions[$module->key()] = $module->permissions();
                }
            }
        }

        $allPermissions = Permission::all();
        $deletedCount = 0;
        $updatedCount = 0;

        foreach ($allPermissions as $permission) {
            $module = $permission->module;
            $action = $permission->action;

            // If the module is unknown or the action is not valid for this module
            if (! isset($validModuleActions[$module]) || ! in_array($action, $validModuleActions[$module], true)) {
                $permission->delete();
                $deletedCount++;

                continue;
            }

            // Ensure proper standard name
            $expectedName = Permission::generateName($module, $action);
            if ($permission->name !== $expectedName) {
                $permission->update(['name' => $expectedName]);
                $updatedCount++;
            }
        }

        // Re-sync system roles with the cleaned up permissions
        SystemRolePermissions::syncAllSystemRoles();

        return [
            'deleted' => $deletedCount,
            'updated' => $updatedCount,
            'remaining' => Permission::count(),
        ];
    }
}
