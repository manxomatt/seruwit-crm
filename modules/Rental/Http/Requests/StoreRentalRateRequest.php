<?php

namespace Modules\Rental\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Modules\Fleet\Support\VehicleRentalClass;

class StoreRentalRateRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'vehicle_id' => ['nullable', 'exists:vehicles,id'],
            'vehicle_type' => ['nullable', 'string', 'max:100'],
            'rental_class' => ['nullable', 'string', Rule::in(VehicleRentalClass::values())],
            'name' => ['required', 'string', 'max:191'],
            'period_type' => ['required', 'in:daily,weekly,monthly'],
            'rate_per_period' => ['required', 'numeric', 'min:0'],
            'km_limit_per_period' => ['nullable', 'integer', 'min:0'],
            'excess_km_rate' => ['nullable', 'numeric', 'min:0'],
            'late_fee_per_day' => ['nullable', 'numeric', 'min:0'],
            'deposit_amount' => ['nullable', 'numeric', 'min:0'],
            'is_active' => ['boolean'],
            'valid_from' => ['nullable', 'date'],
            'valid_to' => ['nullable', 'date', 'after_or_equal:valid_from'],
            'min_periods' => ['nullable', 'integer', 'min:1'],
            'priority' => ['nullable', 'integer', 'min:0', 'max:999'],
            'notes' => ['nullable', 'string'],
        ];
    }
}
