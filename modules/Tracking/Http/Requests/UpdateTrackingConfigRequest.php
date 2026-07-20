<?php

namespace Modules\Tracking\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Modules\Tracking\Models\TrackingConfig;

class UpdateTrackingConfigRequest extends FormRequest
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
            'base_url' => ['nullable', 'url', 'max:255'],
            'auth_type' => ['required', Rule::in([TrackingConfig::AUTH_BASIC, TrackingConfig::AUTH_TOKEN])],
            'email' => ['nullable', 'string', 'max:255'],
            // Secrets are never sent back to the browser, so an empty field
            // means "leave what is stored alone" rather than "clear it".
            'password' => ['nullable', 'string', 'max:255'],
            'token' => ['nullable', 'string', 'max:1000'],
            'poll_enabled' => ['boolean'],
            'geofence_radius_m' => ['required', 'integer', 'min:20', 'max:5000'],
            'checkpoint_min_distance_m' => ['required', 'integer', 'min:20', 'max:10000'],
            'checkpoint_min_interval_minutes' => ['required', 'integer', 'min:1', 'max:120'],
            'retention_days' => ['required', 'integer', 'min:1', 'max:3650'],
        ];
    }
}
