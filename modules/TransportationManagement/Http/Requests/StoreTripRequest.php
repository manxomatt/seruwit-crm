<?php

namespace Modules\TransportationManagement\Http\Requests;

use App\Modules\Facades\Modules;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Modules\Fleet\Models\Driver;
use Modules\Fleet\Models\Vehicle;
use Modules\Rental\Models\Rental;
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

                // Guard against double-booking a vehicle that is in an active rental.
                if (Modules::available('rental') && Rental::hasOverlapFor($vehicle->id, $date, $date, null)) {
                    $validator->errors()->add('vehicle_id', "Vehicle {$vehicle->name} is blocked by an active rental on this date.");
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
            'vehicle_id.required' => __('transportation.validation.vehicle_required'),
            'vehicle_id.exists' => __('transportation.validation.vehicle_exists'),
            'driver_id.required' => __('transportation.validation.driver_required'),
            'driver_id.exists' => __('transportation.validation.driver_exists'),
            'partner_id.required' => __('transportation.validation.partner_required'),
            'partner_id.exists' => __('transportation.validation.partner_exists'),
        ];
    }
}
