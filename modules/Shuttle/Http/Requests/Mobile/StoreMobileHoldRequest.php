<?php

namespace Modules\Shuttle\Http\Requests\Mobile;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Modules\Shuttle\Models\ShuttleBooking;

class StoreMobileHoldRequest extends FormRequest
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
        $hasBearer = filled($this->bearerToken());

        return [
            'departure_id' => ['required', 'integer', 'exists:shuttle_departures,id'],
            'passenger_count' => ['required', 'integer', 'min:1', 'max:20'],
            'pickup_mode' => ['required', Rule::in([ShuttleBooking::MODE_POOL, ShuttleBooking::MODE_DOOR])],
            'dropoff_mode' => ['required', Rule::in([ShuttleBooking::MODE_POOL, ShuttleBooking::MODE_DOOR])],
            'booker_phone' => [$hasBearer ? 'nullable' : 'required', 'string', 'max:32'],
            'otp_code' => [$hasBearer ? 'nullable' : 'required', 'string', 'size:6'],
            'pickup_address' => ['nullable', 'required_if:pickup_mode,door', 'string', 'max:500'],
            'pickup_lat' => ['nullable', 'required_if:pickup_mode,door', 'numeric', 'between:-90,90'],
            'pickup_lng' => ['nullable', 'required_if:pickup_mode,door', 'numeric', 'between:-180,180'],
            'dropoff_address' => ['nullable', 'required_if:dropoff_mode,door', 'string', 'max:500'],
            'dropoff_lat' => ['nullable', 'required_if:dropoff_mode,door', 'numeric', 'between:-90,90'],
            'dropoff_lng' => ['nullable', 'required_if:dropoff_mode,door', 'numeric', 'between:-180,180'],
            'notes' => ['nullable', 'string', 'max:1000'],
            'passengers' => ['required', 'array', 'min:1'],
            'passengers.*.name' => ['required', 'string', 'max:120'],
            'passengers.*.phone' => ['nullable', 'string', 'max:32'],
            'passengers.*.id_number' => ['nullable', 'string', 'max:64'],
        ];
    }
}
