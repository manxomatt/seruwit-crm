<?php

namespace App\Http\Requests;

use App\Models\MailConfig;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class UpdateMailConfigRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->hasPermissionFor('settings', 'update') ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'is_enabled' => ['required', 'boolean'],
            'host' => ['nullable', 'required_if:is_enabled,true', 'string', 'max:255'],
            'port' => ['nullable', 'required_if:is_enabled,true', 'integer', 'min:1', 'max:65535'],
            'encryption' => ['nullable', 'string', Rule::in(MailConfig::ENCRYPTIONS)],
            'username' => ['nullable', 'required_if:is_enabled,true', 'string', 'max:255'],
            'password' => ['nullable', 'string', 'max:255'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'host.required_if' => __('settings.mail.validation.host_required'),
            'port.required_if' => __('settings.mail.validation.port_required'),
            'username.required_if' => __('settings.mail.validation.username_required'),
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            if (! $this->boolean('is_enabled')) {
                return;
            }

            if (filled($this->input('password'))) {
                return;
            }

            $existing = MailConfig::tableReady()
                ? MailConfig::query()->value('password')
                : null;

            if (blank($existing)) {
                $validator->errors()->add('password', __('settings.mail.validation.password_required'));
            }
        });
    }
}
