<?php

namespace App\Http\Requests\Install;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

class AdminAccountRequest extends FormRequest
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
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255'],
            'password' => ['required', 'confirmed', Password::defaults()],
        ];
    }

    /**
     * @return array{name: string, email: string, password: string}
     */
    public function adminData(): array
    {
        return [
            'name' => (string) $this->input('name'),
            'email' => (string) $this->input('email'),
            'password' => (string) $this->input('password'),
        ];
    }
}
