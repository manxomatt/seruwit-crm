<?php

namespace Modules\Shuttle\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateShuttleSettingsRequest extends FormRequest
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
            'default_seat_capacity' => ['required', 'integer', 'min:1', 'max:100'],
            'default_pickup_cutoff_minutes' => ['required', 'integer', 'min:0', 'max:1440'],
            'default_pool_base_fare' => ['required', 'numeric', 'min:0'],
            'default_door_base_fare' => ['required', 'numeric', 'min:0'],
            'passenger_booking_enabled' => ['nullable'],
            'hold_ttl_minutes' => ['required', 'integer', 'min:5', 'max:120'],
            'public_brand_name' => ['required', 'string', 'max:120'],
            'public_brand_color' => ['required', 'string', 'max:20'],
        ];
    }
}
