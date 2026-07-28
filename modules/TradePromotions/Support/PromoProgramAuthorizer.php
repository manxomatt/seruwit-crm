<?php

namespace Modules\TradePromotions\Support;

use App\Models\User;
use App\Modules\Facades\Modules;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\Validator;
use Modules\Inventory\Support\AccessibleWarehouses;
use Modules\TradePromotions\Models\TradePromoProgram;

final class PromoProgramAuthorizer
{
    public static function canManageGlobal(?User $user): bool
    {
        return $user?->isAdmin() ?? false;
    }

    public static function canManageSiteScope(?User $user): bool
    {
        if ($user === null) {
            return false;
        }

        if ($user->isAdmin()) {
            return true;
        }

        return $user->hasAnyRole(AccessibleWarehouses::scopedRoleSlugs())
            && $user->hasPermissionFor('promotions', 'create');
    }

    /**
     * @param  list<int>|array<int, mixed>  $warehouseIds
     */
    public static function assertCanAssignWarehouses(Validator $validator, ?User $user, array $warehouseIds): void
    {
        if ($user === null) {
            $validator->errors()->add('warehouse_ids', __('promotions.validation.unauthorized'));

            return;
        }

        if ($user->isAdmin()) {
            return;
        }

        $allowed = AccessibleWarehouses::ids($user);

        if ($allowed === null) {
            $validator->errors()->add('warehouse_ids', __('promotions.validation.site_role_required'));

            return;
        }

        foreach ($warehouseIds as $warehouseId) {
            if (! in_array((int) $warehouseId, $allowed, true)) {
                $validator->errors()->add('warehouse_ids', __('promotions.validation.warehouse_not_accessible'));

                return;
            }
        }
    }

    public static function assertCanSetScope(Validator $validator, ?User $user, string $scope): void
    {
        if ($scope === TradePromoProgram::SCOPE_GLOBAL && ! self::canManageGlobal($user)) {
            $validator->errors()->add('scope', __('promotions.validation.global_admin_only'));
        }
    }

    public static function promotionsAvailable(): bool
    {
        if (! Modules::installed('promotions')) {
            return false;
        }

        return Schema::hasTable('trade_promo_programs') && Schema::hasColumn('trade_promo_programs', 'mode');
    }
}
