<?php

namespace Modules\DriverScoring\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateScoringSettingsRequest extends FormRequest
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
            'harsh_brake_kph_per_s' => ['required', 'numeric', 'min:1'],
            'harsh_accel_kph_per_s' => ['required', 'numeric', 'min:1'],
            'speeding_limit_kph' => ['required', 'numeric', 'min:10'],
            'idle_speed_kph' => ['required', 'numeric', 'min:0'],
            'idle_minutes' => ['required', 'integer', 'min:1'],
            'min_sample_seconds' => ['required', 'integer', 'min:1'],
            'max_sample_seconds' => ['required', 'integer', 'min:5'],
            'event_dedupe_seconds' => ['required', 'integer', 'min:5'],
            'daily_base_points' => ['required', 'integer', 'min:0', 'max:100'],
            'points_harsh_brake' => ['required', 'integer', 'max:0'],
            'points_harsh_accel' => ['required', 'integer', 'max:0'],
            'points_speeding' => ['required', 'integer', 'max:0'],
            'points_idle' => ['required', 'integer', 'max:0'],
        ];
    }
}
