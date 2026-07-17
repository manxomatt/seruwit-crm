<?php

namespace Modules\TransportationManagement\Http\Requests;

use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Modules\TransportationManagement\Models\Driver;
use Modules\TransportationManagement\Models\Vehicle;

class StoreTripRequest extends FormRequest
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
            'vehicle_id' => ['required', 'integer', 'exists:vehicles,id'],
            'driver_id' => ['required', 'integer', 'exists:drivers,id'],
            'origin' => ['required', 'string', 'max:255'],
            'destination' => ['required', 'string', 'max:255'],
            'cargo_notes' => ['nullable', 'string', 'max:2000'],
            'scheduled_at' => ['required', 'date'],
            'distance_km' => ['nullable', 'numeric', 'min:0'],
        ];
    }

    /**
     * A vehicle or driver already tied to a scheduled or in-progress trip
     * cannot be double-booked onto another one.
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            $vehicleId = $this->input('vehicle_id');
            $driverId = $this->input('driver_id');

            if ($vehicleId && Vehicle::find($vehicleId)?->hasActiveTrip()) {
                $validator->errors()->add('vehicle_id', 'This vehicle is already assigned to an active trip.');
            }

            if ($driverId && Driver::find($driverId)?->hasActiveTrip()) {
                $validator->errors()->add('driver_id', 'This driver is already assigned to an active trip.');
            }
        });
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'vehicle_id.required' => 'Select a vehicle for this trip.',
            'vehicle_id.exists' => 'The selected vehicle does not exist.',
            'driver_id.required' => 'Select a driver for this trip.',
            'driver_id.exists' => 'The selected driver does not exist.',
        ];
    }
}
