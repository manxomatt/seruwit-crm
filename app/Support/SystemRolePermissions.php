<?php

namespace App\Support;

use App\Models\Permission;
use App\Models\Role;
use Illuminate\Support\Facades\Schema;

class SystemRolePermissions
{
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
}
