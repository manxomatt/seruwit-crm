<?php

namespace Modules\TransportationManagement\Http\Requests;

use App\Modules\Facades\Modules;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Carbon;
use Modules\Fleet\Models\Driver;
use Modules\Fleet\Models\Vehicle;
use Modules\Rental\Models\Rental;
use Modules\TransportationManagement\Models\Trip;

class StoreTripRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
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
            'scheduled_end_at' => ['nullable', 'date', 'after:scheduled_at'],
            'distance_km' => ['nullable', 'numeric', 'min:0'],
        ];
    }

    protected function prepareForValidation(): void
    {
        if (! $this->filled('scheduled_at')) {
            return;
        }

        if ($this->filled('scheduled_end_at')) {
            return;
        }

        $distance = $this->filled('distance_km') ? (float) $this->input('distance_km') : null;

        $this->merge([
            'scheduled_end_at' => Trip::estimateEndAt($this->input('scheduled_at'), $distance)->toDateTimeString(),
        ]);
    }

    /**
     * A vehicle/driver must be dispatchable for the chosen time window: not
     * overlapping another active trip, active/available, and with valid papers.
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $startsAt = $this->input('scheduled_at');
            $endsAt = $this->input('scheduled_end_at');

            if (! $startsAt) {
                return;
            }

            $distance = $this->filled('distance_km') ? (float) $this->input('distance_km') : null;

            if ($vehicle = Vehicle::find($this->input('vehicle_id'))) {
                foreach (Trip::vehicleDispatchReasons($vehicle, $startsAt, $endsAt, $this->excludingTripId(), $distance) as $reason) {
                    $validator->errors()->add('vehicle_id', $reason);
                }

                if (Modules::available('rental')) {
                    $startDay = Carbon::parse($startsAt)->toDateString();
                    $endDay = Carbon::parse($endsAt ?: $startsAt)->toDateString();

                    if (Rental::hasOverlapFor($vehicle->id, $startDay, $endDay, null)) {
                        $validator->errors()->add('vehicle_id', __('transportation.messages.vehicle_rental_blocked', [
                            'name' => $vehicle->name,
                        ]));
                    }
                }
            }

            if ($driver = Driver::find($this->input('driver_id'))) {
                foreach (Trip::driverDispatchReasons($driver, $startsAt, $endsAt, $this->excludingTripId(), $distance) as $reason) {
                    $validator->errors()->add('driver_id', $reason);
                }
            }
        });
    }

    protected function excludingTripId(): ?int
    {
        return null;
    }

    /**
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
            'scheduled_end_at.after' => __('transportation.validation.scheduled_end_after'),
        ];
    }
}
