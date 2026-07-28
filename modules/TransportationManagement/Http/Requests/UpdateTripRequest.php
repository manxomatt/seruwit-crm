<?php

namespace Modules\TransportationManagement\Http\Requests;

use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Modules\Fleet\Models\Driver;
use Modules\Fleet\Models\Vehicle;
use Modules\TransportationManagement\Models\Trip;

class UpdateTripRequest extends FormRequest
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
            'vehicle_id' => ['sometimes', 'required', 'integer', 'exists:vehicles,id'],
            'driver_id' => ['sometimes', 'required', 'integer', 'exists:drivers,id'],
            'partner_id' => ['sometimes', 'required', 'integer', 'exists:partners,id'],
            'origin' => ['sometimes', 'required', 'string', 'max:255'],
            'destination' => ['sometimes', 'required', 'string', 'max:255'],
            'cargo_notes' => ['nullable', 'string', 'max:2000'],
            'scheduled_at' => ['sometimes', 'required', 'date'],
            'scheduled_end_at' => ['sometimes', 'nullable', 'date', 'after:scheduled_at'],
            'distance_km' => ['nullable', 'numeric', 'min:0'],
        ];
    }

    protected function prepareForValidation(): void
    {
        /** @var Trip|null $trip */
        $trip = $this->route('trip');
        $startsAt = $this->input('scheduled_at', $trip?->scheduled_at);

        if (! $startsAt) {
            return;
        }

        if ($this->filled('scheduled_end_at')) {
            return;
        }

        if (! $this->has('scheduled_at') && ! $this->has('distance_km') && $trip?->scheduled_end_at) {
            return;
        }

        $distance = $this->filled('distance_km')
            ? (float) $this->input('distance_km')
            : ($trip?->distance_km !== null ? (float) $trip->distance_km : null);

        $this->merge([
            'scheduled_end_at' => Trip::estimateEndAt($startsAt, $distance)->toDateTimeString(),
        ]);
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            /** @var Trip|null $trip */
            $trip = $this->route('trip');
            $startsAt = $this->input('scheduled_at', $trip?->scheduled_at);
            $endsAt = $this->input('scheduled_end_at', $trip?->scheduled_end_at);

            if (! $startsAt) {
                return;
            }

            $distance = $this->filled('distance_km')
                ? (float) $this->input('distance_km')
                : ($trip?->distance_km !== null ? (float) $trip->distance_km : null);

            $windowTouched = $this->has('scheduled_at')
                || $this->has('scheduled_end_at')
                || $this->has('vehicle_id')
                || $this->has('driver_id')
                || $this->has('distance_km');

            if (! $windowTouched) {
                return;
            }

            if ($this->has('vehicle_id') || $this->has('scheduled_at') || $this->has('scheduled_end_at') || $this->has('distance_km')) {
                $vehicleId = $this->input('vehicle_id', $trip?->vehicle_id);
                if ($vehicle = Vehicle::find($vehicleId)) {
                    foreach (Trip::vehicleDispatchReasons($vehicle, $startsAt, $endsAt, $trip?->id, $distance) as $reason) {
                        $validator->errors()->add('vehicle_id', $reason);
                    }
                }
            }

            if ($this->has('driver_id') || $this->has('scheduled_at') || $this->has('scheduled_end_at') || $this->has('distance_km')) {
                $driverId = $this->input('driver_id', $trip?->driver_id);
                if ($driver = Driver::find($driverId)) {
                    foreach (Trip::driverDispatchReasons($driver, $startsAt, $endsAt, $trip?->id, $distance) as $reason) {
                        $validator->errors()->add('driver_id', $reason);
                    }
                }
            }
        });
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'vehicle_id.exists' => __('transportation.validation.vehicle_exists'),
            'driver_id.exists' => __('transportation.validation.driver_exists'),
            'partner_id.exists' => __('transportation.validation.partner_exists'),
            'scheduled_end_at.after' => __('transportation.validation.scheduled_end_after'),
        ];
    }
}
