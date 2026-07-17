<?php

namespace App\Http\Requests;

use App\Modules\Facades\Modules;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StorePlanRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('manage-plans') ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            // Tenants carry the key, not a foreign key, so it is the plan's
            // identity for good — see PlanController::update, which refuses to
            // change it.
            'key' => ['required', 'string', 'max:50', 'regex:/^[a-z0-9-]+$/', Rule::unique('plans', 'key')],
            'name' => ['required', 'string', 'max:100'],
            'description' => ['nullable', 'string', 'max:255'],
            'modules' => ['present', 'array'],
            'modules.*' => ['string', Rule::in(array_keys(Modules::all()))],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'is_default' => ['boolean'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'key.regex' => 'Kunci hanya boleh berisi huruf kecil, angka, dan tanda hubung.',
            'key.unique' => 'Kunci ini sudah dipakai paket lain.',
            'modules.*.in' => 'Modul tersebut tidak terdaftar.',
        ];
    }
}
