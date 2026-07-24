<?php

namespace Modules\Routing\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Modules\Routing\Models\RoutePlan;

class StoreRoutePlanRequest extends FormRequest
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
            'planned_date' => ['required', 'date'],
            'objective' => ['required', 'string', Rule::in([RoutePlan::OBJECTIVE_DISTANCE, RoutePlan::OBJECTIVE_FUEL_COST])],
            'depot_address' => ['nullable', 'string', 'max:255'],
            'depot_lat' => ['required', 'numeric', 'between:-90,90'],
            'depot_lng' => ['required', 'numeric', 'between:-180,180'],
            'delivery_order_ids' => ['nullable', 'array'],
            'delivery_order_ids.*' => ['integer', 'exists:delivery_orders,id'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'depot_lat.required' => 'Depot latitude is required for routing.',
            'depot_lng.required' => 'Depot longitude is required for routing.',
            'objective.in' => 'Choose distance or fuel cost as the objective.',
        ];
    }
}
