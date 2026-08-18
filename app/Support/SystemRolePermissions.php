<?php

namespace App\Support;

use App\Models\Permission;
use App\Models\Role;
use Illuminate\Support\Facades\Schema;

class SystemRolePermissions
{
    /**
     * Get official system role definition by slug.
     *
     * @return array{slug: string, name: string, description: string, is_system: bool, dashboard_path: string}|null
     */
    public static function getSystemRoleDefinition(string $slug): ?array
    {
        return match ($slug) {
            'admin' => [
                'slug' => 'admin',
                'name' => 'Administrator',
                'description' => 'Full access to all system features',
                'is_system' => true,
                'dashboard_path' => '/module/dashboard',
            ],
            'user' => [
                'slug' => 'user',
                'name' => 'User',
                'description' => 'Read-only access to system features',
                'is_system' => true,
                'dashboard_path' => '/module/dashboard',
            ],
            'driver' => [
                'slug' => 'driver',
                'name' => 'Driver',
                'description' => 'Mobile delivery driver — POD only',
                'is_system' => true,
                'dashboard_path' => '/module/driver/today',
            ],
            'salesperson' => [
                'slug' => 'salesperson',
                'name' => 'Salesperson',
                'description' => 'Field salesperson — mobile canvassing portal only',
                'is_system' => true,
                'dashboard_path' => '/module/canvassing/portal/today',
            ],
            'reseller' => [
                'slug' => 'reseller',
                'name' => 'Reseller',
                'description' => 'Can manage tenants they own on the central control plane',
                'is_system' => true,
                'dashboard_path' => '/module/tenants',
            ],
            'warehouse_head' => [
                'slug' => 'warehouse_head',
                'name' => 'Warehouse Head',
                'description' => 'Owns operations for a single warehouse or store site',
                'is_system' => true,
                'dashboard_path' => '/module/inventory/warehouses',
            ],
            'warehouse_manager' => [
                'slug' => 'warehouse_manager',
                'name' => 'Warehouse Manager',
                'description' => 'Owns operations across one or more warehouse or store sites',
                'is_system' => true,
                'dashboard_path' => '/module/inventory/warehouses',
            ],
            'fleet_base_head' => [
                'slug' => 'fleet_base_head',
                'name' => 'Fleet Base Head',
                'description' => 'Owns operations for a single fleet home base',
                'is_system' => true,
                'dashboard_path' => '/module/fleet/bases',
            ],
            'fleet_base_manager' => [
                'slug' => 'fleet_base_manager',
                'name' => 'Fleet Base Manager',
                'description' => 'Owns operations across one or more fleet home bases',
                'is_system' => true,
                'dashboard_path' => '/module/fleet/bases',
            ],
            default => null,
        };
    }

    /**
     * Create system roles belonging to a specific module if they do not exist yet.
     */
    public static function seedRolesForModule(string $moduleKey): void
    {
        if (! Schema::hasTable('roles')) {
            return;
        }

        $roleSlugs = match ($moduleKey) {
            'inventory' => ['warehouse_head', 'warehouse_manager'],
            'fleet' => ['fleet_base_head', 'fleet_base_manager'],
            'canvassing' => ['salesperson'],
            'transportation', 'driver_scoring', 'orders' => ['driver'],
            default => [],
        };

        foreach ($roleSlugs as $slug) {
            $definition = self::getSystemRoleDefinition($slug);

            if ($definition !== null) {
                Role::query()->firstOrCreate(['slug' => $slug], $definition);
            }
        }
    }

    /**
     * Permission IDs that are seeded as defaults for a system role and must stay assigned.
     *
     * @return list<int>
     */
    public static function defaultIdsFor(Role $role): array
    {
        if (! $role->isSystemRole() || ! Schema::hasTable('permissions')) {
            return [];
        }

        return match ($role->slug) {
            'admin' => Permission::query()->pluck('id')->map(fn ($id): int => (int) $id)->all(),
            'user' => Permission::query()
                ->where('action', 'view')
                ->pluck('id')
                ->map(fn ($id): int => (int) $id)
                ->all(),
            'driver' => Permission::query()
                ->where(function ($query): void {
                    $query
                        ->where(fn ($q) => $q->where('module', 'orders')->whereIn('action', ['view', 'deliver']))
                        ->orWhere(fn ($q) => $q->where('module', 'transportation')->where('action', 'view'));
                })
                ->pluck('id')
                ->map(fn ($id): int => (int) $id)
                ->all(),
            'salesperson' => Permission::query()
                ->where(fn ($q) => $q->where('module', 'canvassing')->whereIn('action', ['view', 'checkin']))
                ->pluck('id')
                ->map(fn ($id): int => (int) $id)
                ->all(),
            'warehouse_head', 'warehouse_manager' => Permission::query()
                ->where(function ($query): void {
                    $query
                        ->where(fn ($q) => $q->where('module', 'inventory')->whereIn('action', ['view', 'create', 'update', 'adjust']))
                        ->orWhere(fn ($q) => $q->where('module', 'products')->where('action', 'view'))
                        ->orWhere(fn ($q) => $q->where('module', 'partners')->where('action', 'view'))
                        ->orWhere(fn ($q) => $q->where('module', 'purchasing')->whereIn('action', ['view', 'create', 'update', 'receive']))
                        ->orWhere(fn ($q) => $q->where('module', 'sales')->whereIn('action', ['view', 'create', 'update', 'issue']))
                        ->orWhere(fn ($q) => $q->where('module', 'orders')->whereIn('action', ['view', 'create']));
                })
                ->pluck('id')
                ->map(fn ($id): int => (int) $id)
                ->all(),
            'fleet_base_head', 'fleet_base_manager' => Permission::query()
                ->where(fn ($q) => $q->where('module', 'fleet')->whereIn('action', ['view', 'create', 'update', 'delete']))
                ->pluck('id')
                ->map(fn ($id): int => (int) $id)
                ->all(),
            default => [],
        };
    }

    /**
     * Merge submitted permissions with locked defaults for a system role.
     *
     * @param  array<int>  $permissionIds
     * @return list<int>
     */
    public static function mergeWithDefaults(Role $role, array $permissionIds): array
    {
        return array_values(array_unique([
            ...self::defaultIdsFor($role),
            ...array_map('intval', $permissionIds),
        ]));
    }

    /**
     * Re-apply locked defaults onto every system role without wiping extras.
     *
     * Called after module install seeds new permission rows, and by RoleSeeder.
     */
    public static function syncAllSystemRoles(): void
    {
        if (! Schema::hasTable('roles') || ! Schema::hasTable('permissions')) {
            return;
        }

        Role::query()
            ->where('is_system', true)
            ->get()
            ->each(function (Role $role): void {
                $role->permissions()->sync(
                    self::mergeWithDefaults(
                        $role,
                        $role->permissions()->pluck('id')->all()
                    )
                );
            });
    }
}
