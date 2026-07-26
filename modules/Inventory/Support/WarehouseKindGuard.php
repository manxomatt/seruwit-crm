<?php

namespace Modules\Inventory\Support;

use Illuminate\Validation\Validator;
use Modules\Inventory\Models\Warehouse;

final class WarehouseKindGuard
{
    public static function rejectIfCannotPurchase(Validator $validator, mixed $warehouseId, string $attribute = 'warehouse_id'): void
    {
        if ($warehouseId === null || $warehouseId === '') {
            return;
        }

        $warehouse = Warehouse::query()->find($warehouseId);

        if ($warehouse === null) {
            return;
        }

        if (! $warehouse->acceptsPurchaseInbound()) {
            $validator->errors()->add(
                $attribute,
                __('inventory.validation.warehouse_kind_not_for_purchase', [
                    'kind' => __($warehouse->kind->labelKey()),
                ]),
            );
        }
    }

    public static function rejectIfCannotSell(Validator $validator, mixed $warehouseId, string $attribute = 'warehouse_id'): void
    {
        if ($warehouseId === null || $warehouseId === '') {
            return;
        }

        $warehouse = Warehouse::query()->find($warehouseId);

        if ($warehouse === null) {
            return;
        }

        if (! $warehouse->acceptsSalesOutbound()) {
            $validator->errors()->add(
                $attribute,
                __('inventory.validation.warehouse_kind_not_for_sale', [
                    'kind' => __($warehouse->kind->labelKey()),
                ]),
            );
        }
    }
}
