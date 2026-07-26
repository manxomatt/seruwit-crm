<?php

namespace App\Http\Requests;

use App\Modules\Facades\Modules;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Modules\Inventory\Support\AccessibleWarehouses;

class UpdateUserRequest extends FormRequest
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
        $rules = [
            'name' => ['required', 'string', 'max:255'],
            'email' => [
                'required',
                'string',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($this->route('user')),
            ],
            'password' => ['nullable', 'string', 'confirmed', Password::defaults()],
            'roles' => ['nullable', 'array'],
            'roles.*' => ['integer', 'exists:roles,id'],
            'first_name' => ['nullable', 'string', 'max:255'],
            'last_name' => ['nullable', 'string', 'max:255'],
            'phone_number' => ['nullable', 'string', 'max:50'],
            'avatar_url' => ['nullable', 'string', 'max:2048'],
            'warehouse_ids' => ['nullable', 'array'],
        ];

        if (Modules::available('inventory') && Schema::hasTable('warehouses')) {
            $rules['warehouse_ids.*'] = ['integer', 'exists:warehouses,id'];
        } else {
            $rules['warehouse_ids.*'] = ['integer'];
        }

        return $rules;
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'name.required' => __('users.validation.name_required'),
            'name.max' => __('users.validation.name_max'),
            'email.required' => __('users.validation.email_required'),
            'email.email' => __('users.validation.email_valid'),
            'email.unique' => __('users.validation.email_unique'),
            'password.confirmed' => __('users.validation.password_confirmed'),
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator): void {
            if (! Modules::available('inventory')) {
                return;
            }

            AccessibleWarehouses::validateAssignment(
                $validator,
                array_map('intval', $this->input('roles', [])),
                array_map('intval', $this->input('warehouse_ids', [])),
            );
        });
    }
}
