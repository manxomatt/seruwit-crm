<?php

namespace Modules\Fleet\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreVehicleRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'plate_number' => ['required', 'string', 'max:20', 'unique:vehicles,plate_number'],
            'type' => ['required', 'string', 'in:car,truck,van,motorcycle,bus'],
            'rental_class' => ['nullable', 'string', 'in:economy,mpv,suv,premium,other'],
            'brand' => ['nullable', 'string', 'max:255'],
            'model_year' => ['nullable', 'integer', 'min:1980', 'max:'.(now()->year + 1)],
            'capacity' => ['nullable', 'string', 'max:100'],
            'capacity_kg' => ['nullable', 'numeric', 'min:0'],
            'cost_per_km' => ['nullable', 'numeric', 'min:0'],
            'tank_capacity_liters' => ['nullable', 'numeric', 'min:0'],
            'expected_km_per_liter' => ['nullable', 'numeric', 'min:0'],
            'fuel_type' => ['required', 'string', 'in:petrol,diesel,electric,hybrid'],
            'status' => ['required', 'string', 'in:active,maintenance,retired,out_of_service'],
            'odometer_km' => ['integer', 'min:0'],
            'stnk_expires_at' => ['nullable', 'date'],
            'kir_expires_at' => ['nullable', 'date'],
            'photo_url' => ['nullable', 'string', 'max:2048'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ];
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'plate_number.required' => 'The plate number is required.',
            'plate_number.unique' => 'This plate number is already registered.',
            'type.in' => 'Select a valid vehicle type.',
            'fuel_type.in' => 'Select a valid fuel type.',
            'status.in' => 'Select a valid vehicle status.',
        ];
    }
}
