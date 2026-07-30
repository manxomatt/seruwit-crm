<?php

namespace Modules\Shuttle\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;
use Modules\Shuttle\Models\ShuttleBooking;
use Modules\Shuttle\Models\ShuttleCorridor;
use Modules\Shuttle\Models\ShuttleDeparture;

class StoreBookingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'departure_id' => ['required', 'exists:shuttle_departures,id'],
            'partner_id' => ['required', 'exists:partners,id'],
            'passenger_count' => ['required', 'integer', 'min:1', 'max:20'],
            'pickup_mode' => ['required', 'in:pool,door'],
            'dropoff_mode' => ['required', 'in:pool,door'],
            'pickup_address' => ['nullable', 'required_if:pickup_mode,door', 'string', 'max:500'],
            'pickup_lat' => ['nullable', 'required_if:pickup_mode,door', 'numeric', 'between:-90,90'],
            'pickup_lng' => ['nullable', 'required_if:pickup_mode,door', 'numeric', 'between:-180,180'],
            'dropoff_address' => ['nullable', 'required_if:dropoff_mode,door', 'string', 'max:500'],
            'dropoff_lat' => ['nullable', 'required_if:dropoff_mode,door', 'numeric', 'between:-90,90'],
            'dropoff_lng' => ['nullable', 'required_if:dropoff_mode,door', 'numeric', 'between:-180,180'],
            'notes' => ['nullable', 'string', 'max:2000'],
            'passengers' => ['required', 'array', 'min:1'],
            'passengers.*.name' => ['required', 'string', 'max:255'],
            'passengers.*.phone' => ['nullable', 'string', 'max:50'],
            'passengers.*.id_number' => ['nullable', 'string', 'max:50'],
        ];
    }

    protected function prepareForValidation(): void
    {
        $departure = ShuttleDeparture::query()->with('corridor')->find($this->integer('departure_id'));

        if ($departure && $departure->resolvedServiceType() === ShuttleCorridor::SERVICE_POOL) {
            $this->merge([
                'pickup_mode' => ShuttleBooking::MODE_POOL,
                'dropoff_mode' => ShuttleBooking::MODE_POOL,
                'pickup_address' => null,
                'pickup_lat' => null,
                'pickup_lng' => null,
                'dropoff_address' => null,
                'dropoff_lat' => null,
                'dropoff_lng' => null,
            ]);
        }
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            if ($validator->errors()->isNotEmpty()) {
                return;
            }

            $departure = ShuttleDeparture::query()->with('corridor')->find($this->integer('departure_id'));
            if (! $departure) {
                return;
            }

            if (! in_array($departure->status, [ShuttleDeparture::STATUS_OPEN, ShuttleDeparture::STATUS_OPTIMIZED], true)) {
                $validator->errors()->add('departure_id', __('shuttle.messages.departure_not_open'));
            }

            if ($departure->seatsRemaining() < $this->integer('passenger_count')) {
                $validator->errors()->add('passenger_count', __('shuttle.messages.insufficient_seats'));
            }

            if (count($this->input('passengers', [])) !== $this->integer('passenger_count')) {
                $validator->errors()->add('passengers', __('shuttle.validation.passenger_count_mismatch'));
            }

            $serviceType = $departure->resolvedServiceType();

            if ($serviceType === ShuttleCorridor::SERVICE_POOL) {
                if ($this->input('pickup_mode') !== ShuttleBooking::MODE_POOL
                    || $this->input('dropoff_mode') !== ShuttleBooking::MODE_POOL) {
                    $validator->errors()->add('pickup_mode', __('shuttle.validation.pool_product_modes'));
                }
            }

            if ($serviceType === ShuttleCorridor::SERVICE_DOOR) {
                if ($this->input('pickup_mode') === ShuttleBooking::MODE_POOL
                    && $this->input('dropoff_mode') === ShuttleBooking::MODE_POOL) {
                    $validator->errors()->add('pickup_mode', __('shuttle.validation.door_product_requires_door'));
                }
            }
        });
    }
}
