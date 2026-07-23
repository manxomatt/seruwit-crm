<?php

namespace Modules\TransportationManagement\Http\Requests;

use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Modules\Fleet\Models\Driver;
use Modules\Fleet\Models\Vehicle;
use Modules\TransportationManagement\Models\Trip;

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
            'partner_id' => ['required', 'integer', 'exists:partners,id'],
            'origin' => ['required', 'string', 'max:255'],
            'destination' => ['required', 'string', 'max:255'],
            'cargo_notes' => ['nullable', 'string', 'max:2000'],
            'scheduled_at' => ['required', 'date'],
            'distance_km' => ['nullable', 'numeric', 'min:0'],
        ];
    }

    /**
     * A vehicle/driver must be dispatchable for the chosen date: not
     * double-booked, active/available, and with valid papers. The rule lives
     * on Trip (reading Fleet's columns downward) so Store, Update and recurring
     * generation all share one definition.
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            $date = $this->input('scheduled_at');

            if (! $date) {
                return;
            }

            if ($vehicle = Vehicle::find($this->input('vehicle_id'))) {
                foreach (Trip::vehicleDispatchReasons($vehicle, $date, $this->excludingTripId()) as $reason) {
                    $validator->errors()->add('vehicle_id', $reason);
                }
            }

            if ($driver = Driver::find($this->input('driver_id'))) {
                foreach (Trip::driverDispatchReasons($driver, $date, $this->excludingTripId()) as $reason) {
                    $validator->errors()->add('driver_id', $reason);
                }
            }
        });
    }

    /**
     * The trip to exclude from double-booking checks — none when creating.
     */
    protected function excludingTripId(): ?int
    {
        return null;
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
            'partner_id.required' => 'Select a customer for this trip.',
            'partner_id.exists' => 'The selected customer does not exist.',
        ];
    }
}
