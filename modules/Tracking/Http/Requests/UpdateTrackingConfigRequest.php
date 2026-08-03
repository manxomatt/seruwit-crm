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
     * Prepare the data for validation.
     */
    protected function prepareForValidation(): void
    {
        if (in_array($this->input('provider'), TrackingConfig::apiKeyProviders(), true)) {
            $this->merge([
                'auth_type' => TrackingConfig::AUTH_API_KEY,
                'email' => null,
                'password' => null,
            ]);
        }
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $usesApiKey = in_array($this->input('provider'), TrackingConfig::apiKeyProviders(), true);

        return [
            'provider' => ['required', Rule::in(TrackingConfig::providers())],
            'base_url' => [$usesApiKey ? 'required' : 'nullable', 'url', 'max:255'],
            'auth_type' => [
                'required',
                Rule::in($usesApiKey
                    ? [TrackingConfig::AUTH_API_KEY]
                    : [TrackingConfig::AUTH_BASIC, TrackingConfig::AUTH_TOKEN]),
            ],
            'email' => ['nullable', 'string', 'max:255'],
            // Secrets are never sent back to the browser, so an empty field
            // means "leave what is stored alone" rather than "clear it".
            'password' => ['nullable', 'string', 'max:255'],
            'token' => ['nullable', 'string', 'max:1000'],
            'poll_enabled' => ['boolean'],
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
