<?php

namespace Modules\Tracking\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateTrackingConfigRequest extends FormRequest
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
            'alerts_enabled' => ['boolean'],
            'alert_speed_kph' => ['required', 'integer', 'min:20', 'max:200'],
            'alert_stale_minutes' => ['required', 'integer', 'min:5', 'max:1440'],
            'alert_idle_minutes' => ['required', 'integer', 'min:5', 'max:1440'],
            'alert_cooldown_minutes' => ['required', 'integer', 'min:5', 'max:1440'],
            'geofence_radius_m' => ['required', 'integer', 'min:20', 'max:5000'],
            'checkpoint_min_distance_m' => ['required', 'integer', 'min:20', 'max:10000'],
            'checkpoint_min_interval_minutes' => ['required', 'integer', 'min:1', 'max:120'],
            'retention_days' => ['required', 'integer', 'min:1', 'max:3650'],
        ];
    }
}
