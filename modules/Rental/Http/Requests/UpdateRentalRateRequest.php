<?php

namespace Modules\Rental\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateRentalRateRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'vehicle_id' => ['nullable', 'exists:vehicles,id'],
            'vehicle_type' => ['nullable', 'string', 'max:100'],
            'name' => ['required', 'string', 'max:191'],
            'period_type' => ['required', 'in:daily,weekly,monthly'],
            'rate_per_period' => ['required', 'numeric', 'min:0'],
            'km_limit_per_period' => ['nullable', 'integer', 'min:0'],
            'excess_km_rate' => ['nullable', 'numeric', 'min:0'],
            'deposit_amount' => ['nullable', 'numeric', 'min:0'],
            'is_active' => ['boolean'],
            'notes' => ['nullable', 'string'],
        ];
    }
}
