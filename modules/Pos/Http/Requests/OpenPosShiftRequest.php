<?php

namespace Modules\Pos\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;
use Modules\Inventory\Support\AccessibleWarehouses;
use Modules\Inventory\Support\WarehouseKind;
use Modules\Inventory\Support\WarehouseKindGuard;

class OpenPosShiftRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'warehouse_id' => ['required', 'integer', 'exists:warehouses,id'],
            'opening_float' => ['required', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $warehouseId = (int) $this->input('warehouse_id');

            if ($warehouseId <= 0) {
                return;
            }

            AccessibleWarehouses::rejectIfDenied($validator, $warehouseId);
            WarehouseKindGuard::rejectIfCannotSell($validator, $warehouseId);

            $warehouse = \Modules\Inventory\Models\Warehouse::query()->find($warehouseId);
            $kind = $warehouse?->kind;

            if ($kind !== null && $kind !== WarehouseKind::Store) {
                $validator->errors()->add('warehouse_id', __('pos.messages.warehouse_not_store'));
            }
        });
    }
}
