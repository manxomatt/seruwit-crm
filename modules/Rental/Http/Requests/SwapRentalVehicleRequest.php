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

    public function withValidator(\Illuminate\Validation\Validator $validator): void
    {
        $validator->after(function (\Illuminate\Validation\Validator $v): void {
            $toVehicle = \Modules\Fleet\Models\Vehicle::find($this->to_vehicle_id);
            if ($toVehicle && ! \Modules\Fleet\Support\AccessibleFleetBases::allowsVehicle($this->user(), $toVehicle)) {
                $v->errors()->add('to_vehicle_id', __('rental.validation.vehicle_access_denied'));
            }
        });
    }
}
