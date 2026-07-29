<?php

namespace Modules\Routing\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;
use Modules\Inventory\Models\Warehouse;
use Modules\Routing\Models\RoutePlan;

class StoreRoutePlanRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $warehouseId = (int) $this->input('warehouse_id');

        if ($warehouseId < 1) {
            return;
        }

        $warehouse = Warehouse::query()->find($warehouseId);

        if ($warehouse === null || $warehouse->latitude === null || $warehouse->longitude === null) {
            return;
        }

        $this->merge([
            'depot_lat' => (float) $warehouse->latitude,
            'depot_lng' => (float) $warehouse->longitude,
            'depot_address' => $this->input('depot_address')
                ?: trim($warehouse->name.($warehouse->location ? ' — '.$warehouse->location : '')),
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'warehouse_id' => ['required', 'integer', 'exists:warehouses,id'],
            'planned_date' => ['required', 'date'],
            'objective' => ['required', 'string', Rule::in([RoutePlan::OBJECTIVE_DISTANCE, RoutePlan::OBJECTIVE_FUEL_COST])],
            'depot_address' => ['nullable', 'string', 'max:255'],
            'depot_lat' => ['required', 'numeric', 'between:-90,90'],
            'depot_lng' => ['required', 'numeric', 'between:-180,180'],
            'delivery_order_ids' => ['required', 'array', 'min:1'],
            'delivery_order_ids.*' => ['integer', 'exists:delivery_orders,id'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $warehouseId = (int) $this->input('warehouse_id');

            if ($warehouseId < 1) {
                return;
            }

            $warehouse = Warehouse::query()->find($warehouseId);

            if ($warehouse === null) {
                return;
            }

            if (! $warehouse->isActive()) {
                $validator->errors()->add('warehouse_id', __('routing.validation.warehouse_inactive'));
            }

            if ($warehouse->latitude === null || $warehouse->longitude === null) {
                $validator->errors()->add('warehouse_id', __('routing.validation.warehouse_missing_coords'));
            }

            if (! $warehouse->acceptsSalesOutbound()) {
                $validator->errors()->add('warehouse_id', __('routing.validation.warehouse_not_outbound'));
            }
        });
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'warehouse_id.required' => __('routing.validation.warehouse_required'),
            'depot_lat.required' => __('routing.validation.depot_lat_required'),
            'depot_lng.required' => __('routing.validation.depot_lng_required'),
            'objective.in' => __('routing.validation.objective_in'),
            'delivery_order_ids.required' => __('routing.validation.orders_required'),
            'delivery_order_ids.min' => __('routing.validation.orders_required'),
        ];
    }
}
