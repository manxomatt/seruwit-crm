<?php

namespace Modules\Fleet\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreFuelLogRequest extends FormRequest
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
            'filled_at' => ['required', 'date'],
            'liters' => ['required', 'numeric', 'min:0.01'],
            'cost' => ['required', 'numeric', 'min:0'],
            'odometer_km' => ['nullable', 'integer', 'min:0'],
            'odometer_source' => ['nullable', 'string', 'in:manual,vehicle,gps'],
            'driver_id' => ['nullable', 'integer', 'exists:drivers,id'],
            'station_name' => ['nullable', 'string', 'max:255'],
            'receipt_number' => ['nullable', 'string', 'max:100'],
            'is_full_tank' => ['sometimes', 'boolean'],
            'price_per_liter' => ['nullable', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'liters.min' => 'Enter a fuel volume greater than zero.',
            'odometer_source.in' => 'Odometer source must be manual, vehicle, or gps.',
        ];
    }
}
