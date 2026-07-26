<?php

namespace Modules\Inventory\Support;

use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\Validator;
use Modules\Inventory\Models\Warehouse;

/**
 * Row-level warehouse access for warehouse_head (one site) and
 * warehouse_manager (one or more sites). Admins and other roles are unrestricted.
 */
final class AccessibleWarehouses
{
    public const ROLE_HEAD = 'warehouse_head';

    public const ROLE_MANAGER = 'warehouse_manager';

    /**
     * @return list<string>
     */
    public static function scopedRoleSlugs(): array
    {
        return [self::ROLE_HEAD, self::ROLE_MANAGER];
    }

    public static function isScoped(?User $user = null): bool
    {
        $user ??= auth()->user();

        if ($user === null || $user->isAdmin()) {
            return false;
        }

        return $user->hasAnyRole(self::scopedRoleSlugs());
    }

    /**
     * @return list<int>|null null = unrestricted
     */
    public static function ids(?User $user = null): ?array
    {
        $user ??= auth()->user();

        if ($user === null || ! self::isScoped($user)) {
            return null;
        }

        if (! Schema::hasTable('user_warehouse')) {
            return [];
        }

        // Relation is attached via InventoryModule::boot() resolveRelationUsing.
        return $user->warehouses()
            ->pluck('warehouses.id')
            ->map(fn ($id): int => (int) $id)
            ->values()
            ->all();
    }

    /**
     * @return Builder<Warehouse>
     */
    public static function query(?User $user = null): Builder
    {
        $query = Warehouse::query();
        $ids = self::ids($user);

        if ($ids === null) {
            return $query;
        }

        if ($ids === []) {
            return $query->whereRaw('0 = 1');
        }

        return $query->whereIn($query->getModel()->getTable().'.id', $ids);
    }

    public static function allows(?User $user, int $warehouseId): bool
    {
        $ids = self::ids($user);

        return $ids === null || in_array($warehouseId, $ids, true);
    }

    public static function rejectIfDenied(Validator $validator, mixed $warehouseId, string $attribute = 'warehouse_id'): void
    {
        if ($warehouseId === null || $warehouseId === '') {
            return;
        }

        if (! self::allows(auth()->user(), (int) $warehouseId)) {
            $validator->errors()->add($attribute, __('inventory.validation.warehouse_access_denied'));
        }
    }

    /**
     * Validate warehouse_ids payload when assigning sites to a scoped role user.
     */
    public static function validateAssignment(Validator $validator, array $roleIds, array $warehouseIds): void
    {
        $slugs = \App\Models\Role::query()
            ->whereIn('id', $roleIds)
            ->pluck('slug')
            ->all();

        $isHead = in_array(self::ROLE_HEAD, $slugs, true);
        $isManager = in_array(self::ROLE_MANAGER, $slugs, true);

        if (! $isHead && ! $isManager) {
            return;
        }

        if ($warehouseIds === []) {
            $validator->errors()->add('warehouse_ids', __('users.validation.warehouse_ids_required'));

            return;
        }

        if ($isHead && ! $isManager && count($warehouseIds) > 1) {
            $validator->errors()->add('warehouse_ids', __('users.validation.warehouse_head_single_site'));
        }
    }
}
