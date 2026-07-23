<?php

namespace Modules\TransportationManagement\Http\Requests;

use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Modules\Fleet\Models\Driver;
use Modules\Fleet\Models\Vehicle;
use Modules\TransportationManagement\Models\Trip;

class UpdateTripRequest extends FormRequest
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
            'vehicle_id' => ['sometimes', 'required', 'integer', 'exists:vehicles,id'],
            'driver_id' => ['sometimes', 'required', 'integer', 'exists:drivers,id'],
            'partner_id' => ['sometimes', 'required', 'integer', 'exists:partners,id'],
            'origin' => ['sometimes', 'required', 'string', 'max:255'],
            'destination' => ['sometimes', 'required', 'string', 'max:255'],
            'cargo_notes' => ['nullable', 'string', 'max:2000'],
            'scheduled_at' => ['sometimes', 'required', 'date'],
            'distance_km' => ['nullable', 'numeric', 'min:0'],
        ];
    }

    /**
     * The reassigned vehicle/driver must be dispatchable for the effective
     * date, excluding this trip itself. Only a resource actually present in the
     * request is checked, so editing an unrelated field never fails because a
     * paper expired since dispatch. Same rule as Store, shared on Trip.
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            $trip = $this->route('trip');
            $date = $this->input('scheduled_at', $trip?->scheduled_at);

            if (! $date) {
                return;
            }

            if ($this->has('vehicle_id') && ($vehicle = Vehicle::find($this->input('vehicle_id')))) {
                foreach (Trip::vehicleDispatchReasons($vehicle, $date, $trip?->id) as $reason) {
                    $validator->errors()->add('vehicle_id', $reason);
                }
            }

            if ($this->has('driver_id') && ($driver = Driver::find($this->input('driver_id')))) {
                foreach (Trip::driverDispatchReasons($driver, $date, $trip?->id) as $reason) {
                    $validator->errors()->add('driver_id', $reason);
                }
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
            'vehicle_id.exists' => 'The selected vehicle does not exist.',
            'driver_id.exists' => 'The selected driver does not exist.',
            'partner_id.exists' => 'The selected customer does not exist.',
        ];
    }
}
