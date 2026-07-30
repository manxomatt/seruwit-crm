<?php

namespace Modules\Rental\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Modules\Rental\Models\Rental;

class SwapRentalVehicleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        /** @var Rental|null $rental */
        $rental = $this->route('rental');

        return [
            'to_vehicle_id' => [
                'required',
                'integer',
                'exists:vehicles,id',
                Rule::notIn([(int) ($rental?->vehicle_id ?? 0)]),
            ],
            'odometer_km' => ['nullable', 'integer', 'min:0'],
            'notes' => ['nullable', 'string', 'max:500'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'to_vehicle_id.required' => __('rental.validation.swap_vehicle_required'),
            'to_vehicle_id.not_in' => __('rental.validation.swap_vehicle_same'),
        ];
    }
}
