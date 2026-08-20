<?php

namespace App\Http\Requests;

use App\Modules\Facades\Modules;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\Rules\Password;
use Modules\Inventory\Support\AccessibleWarehouses;

class StoreUserRequest extends FormRequest
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
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'confirmed', Password::defaults()],
            'roles' => ['nullable', 'array'],
            'roles.*' => ['integer', 'exists:roles,id'],
            'first_name' => ['nullable', 'string', 'max:255'],
            'last_name' => ['nullable', 'string', 'max:255'],
            'phone_number' => ['nullable', 'string', 'max:50'],
            'avatar_url' => ['nullable', 'string', 'max:2048'],
            'warehouse_ids' => ['nullable', 'array'],
            'fleet_base_ids' => ['nullable', 'array'],
        ];

        if (Modules::available('inventory') && Schema::hasTable('warehouses')) {
            $rules['warehouse_ids.*'] = ['integer', 'exists:warehouses,id'];
        } else {
            $rules['warehouse_ids.*'] = ['integer'];
        }

        if (Modules::available('fleet') && Schema::hasTable('fleet_bases')) {
            $rules['fleet_base_ids.*'] = ['integer', 'exists:fleet_bases,id'];
        } else {
            $rules['fleet_base_ids.*'] = ['integer'];
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
            'password.required' => __('users.validation.password_required'),
            'password.confirmed' => __('users.validation.password_confirmed'),
            'roles.array' => __('users.validation.roles_array'),
            'roles.*.exists' => __('users.validation.roles_exists'),
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator): void {
            if (Modules::available('inventory')) {
                AccessibleWarehouses::validateAssignment(
                    $validator,
                    array_map('intval', $this->input('roles', [])),
                    array_map('intval', $this->input('warehouse_ids', [])),
                );
            }

            if (Modules::available('fleet')) {
                \Modules\Fleet\Support\AccessibleFleetBases::validateAssignment(
                    $validator,
                    array_map('intval', $this->input('roles', [])),
                    array_map('intval', $this->input('fleet_base_ids', [])),
                );
            }

            $tenant = tenant();
            if ($tenant instanceof \App\Models\Tenant && $tenant->hasReachedLimit('max_users', \App\Models\User::count())) {
                $limit = (int) $tenant->planLimit('max_users');
                $validator->errors()->add('email', __('users.messages.limit_reached_users', ['limit' => $limit]));
            }
        });
    }
}
