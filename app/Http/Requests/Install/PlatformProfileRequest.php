<?php

namespace App\Http\Requests\Install;

use App\Support\SystemMode;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class PlatformProfileRequest extends FormRequest
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
            'app_name' => ['required', 'string', 'max:255'],
            'app_url' => ['required', 'url', 'max:255'],
            'tenant_base_domain' => ['nullable', 'string', 'max:255'],
            'profile' => ['required', Rule::in(['development', 'production'])],
            'ai_features_enabled' => ['sometimes', 'boolean'],
        ];
    }

    public function isProduction(): bool
    {
        return $this->input('profile') === 'production';
    }

    /**
     * Production is the thin control plane (central does not serve the CRM) and
     * runs in production mode; development mirrors the local-dev defaults.
     */
    public function systemMode(): string
    {
        return $this->isProduction() ? SystemMode::PRODUCTION : SystemMode::DEVELOPMENT;
    }
}
