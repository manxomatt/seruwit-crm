<?php

use App\Models\Permission;
use App\Support\SystemRolePermissions;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('permissions')) {
            return;
        }

        $actions = ['view', 'bookings', 'dispatch', 'damages', 'finance', 'rates', 'settings'];

        foreach ($actions as $action) {
            Permission::query()->firstOrCreate(
                ['module' => 'rental', 'action' => $action],
                [
                    'name' => Permission::generateName('rental', $action),
                    'slug' => Permission::generateSlug('rental', $action),
                    'description' => "Allows {$action} operation on Rental",
                ]
            );
        }

        // Clean up obsolete generic actions for rental module
        $obsoleteActions = ['create', 'update', 'delete', 'approve'];
        $obsoletePermissionIds = Permission::query()
            ->where('module', 'rental')
            ->whereIn('action', $obsoleteActions)
            ->pluck('id')
            ->all();

        if ($obsoletePermissionIds !== []) {
            if (Schema::hasTable('permission_role')) {
                DB::table('permission_role')->whereIn('permission_id', $obsoletePermissionIds)->delete();
            }
            Permission::query()->whereIn('id', $obsoletePermissionIds)->delete();
        }

        SystemRolePermissions::syncAllSystemRoles();
    }

    public function down(): void
    {
        if (! Schema::hasTable('permissions')) {
            return;
        }

        $newActions = ['bookings', 'dispatch', 'damages', 'finance', 'rates', 'settings'];
        $newPermissionIds = Permission::query()
            ->where('module', 'rental')
            ->whereIn('action', $newActions)
            ->pluck('id')
            ->all();

        if ($newPermissionIds !== []) {
            if (Schema::hasTable('permission_role')) {
                DB::table('permission_role')->whereIn('permission_id', $newPermissionIds)->delete();
            }
            Permission::query()->whereIn('id', $newPermissionIds)->delete();
        }

        $legacyActions = ['view', 'create', 'update', 'delete', 'approve'];
        foreach ($legacyActions as $action) {
            Permission::query()->firstOrCreate(
                ['module' => 'rental', 'action' => $action],
                [
                    'name' => Permission::generateName('rental', $action),
                    'slug' => Permission::generateSlug('rental', $action),
                    'description' => "Allows {$action} operation on Rental",
                ]
            );
        }

        SystemRolePermissions::syncAllSystemRoles();
    }
};
