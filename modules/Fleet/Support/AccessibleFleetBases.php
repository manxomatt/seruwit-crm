<?php

namespace Modules\Fleet\Support;

use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\Validator;
use Modules\Fleet\Models\FleetBase;

/**
 * Row-level fleet base access for fleet_base_head (one base) and
 * fleet_base_manager (one or more bases). Admins and other roles are unrestricted.
 */
final class AccessibleFleetBases
{
    public const ROLE_HEAD = 'fleet_base_head';

    public const ROLE_MANAGER = 'fleet_base_manager';

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

        if (! Schema::hasTable('user_fleet_base')) {
            return [];
        }

        return $user->fleetBases()
            ->pluck('fleet_bases.id')
            ->map(fn ($id): int => (int) $id)
            ->values()
            ->all();
    }

    /**
     * @return Builder<FleetBase>
     */
    public static function query(?User $user = null): Builder
    {
        $query = FleetBase::query();
        $ids = self::ids($user);

        if ($ids === null) {
            return $query;
        }

        if ($ids === []) {
            return $query->whereRaw('0 = 1');
        }

        return $query->whereIn($query->getModel()->getTable().'.id', $ids);
    }

    public static function allows(?User $user, int $fleetBaseId): bool
    {
        $ids = self::ids($user);

        return $ids === null || in_array($fleetBaseId, $ids, true);
    }

    public static function rejectIfDenied(Validator $validator, mixed $fleetBaseId, string $attribute = 'home_base_id'): void
    {
        if ($fleetBaseId === null || $fleetBaseId === '') {
            return;
        }

        if (! self::allows(auth()->user(), (int) $fleetBaseId)) {
            $validator->errors()->add($attribute, __('fleet.validation.base_access_denied'));
        }
    }

    /**
     * Validate fleet_base_ids payload when assigning bases to a scoped role user.
     */
    public static function validateAssignment(Validator $validator, array $roleIds, array $fleetBaseIds): void
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

        if ($fleetBaseIds === []) {
            $validator->errors()->add('fleet_base_ids', __('users.validation.fleet_base_ids_required'));

            return;
        }

        if ($isHead && ! $isManager && count($fleetBaseIds) > 1) {
            $validator->errors()->add('fleet_base_ids', __('users.validation.fleet_base_head_single_base'));
        }
    }
}
