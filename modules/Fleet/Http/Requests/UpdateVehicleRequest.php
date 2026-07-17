<?php

namespace Modules\TransportationManagement\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateVehicleRequest extends FormRequest
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
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'plate_number' => ['sometimes', 'required', 'string', 'max:20', Rule::unique('vehicles')->ignore($this->route('vehicle'))],
            'type' => ['sometimes', 'required', 'string', 'in:car,truck,van,motorcycle,bus'],
            'brand' => ['nullable', 'string', 'max:255'],
            'model_year' => ['nullable', 'integer', 'min:1980', 'max:'.(now()->year + 1)],
            'capacity' => ['nullable', 'string', 'max:100'],
            'fuel_type' => ['sometimes', 'required', 'string', 'in:petrol,diesel,electric,hybrid'],
            'status' => ['sometimes', 'required', 'string', 'in:active,maintenance,retired,out_of_service'],
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
