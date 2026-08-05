<?php

namespace Modules\Tracking\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Modules\Tracking\Models\GpsSource;

class StoreGpsSourceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        if (in_array($this->input('provider'), GpsSource::apiKeyProviders(), true)) {
            $this->merge([
                'auth_type' => GpsSource::AUTH_API_KEY,
                'email' => null,
                'password' => null,
            ]);
        }
    }

    /**
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $usesApiKey = in_array($this->input('provider'), GpsSource::apiKeyProviders(), true);

        return [
            'name' => ['required', 'string', 'max:100'],
            'provider' => ['required', Rule::in(GpsSource::providers())],
            'base_url' => [$usesApiKey ? 'required' : 'nullable', 'url', 'max:255'],
            'auth_type' => [
                'required',
                Rule::in($usesApiKey
                    ? [GpsSource::AUTH_API_KEY]
                    : [GpsSource::AUTH_BASIC, GpsSource::AUTH_TOKEN]),
            ],
            'email' => ['nullable', 'string', 'max:255'],
            'password' => ['nullable', 'string', 'max:255'],
            'token' => ['nullable', 'string', 'max:1000'],
            'poll_enabled' => ['boolean'],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator): void {
            if (GpsSource::query()->count() >= GpsSource::MAX_PER_TENANT) {
                $validator->errors()->add(
                    'name',
                    __('tracking.messages.source_limit', ['max' => GpsSource::MAX_PER_TENANT]),
                );
            }
        });
    }
}
