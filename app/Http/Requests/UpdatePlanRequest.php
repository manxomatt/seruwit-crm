<?php

namespace App\Http\Requests;

use App\Modules\Facades\Modules;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Note the absence of `key`: tenants reference their plan by key, so renaming one
 * would orphan every tenant on it. The key is set once, at creation.
 */
class UpdatePlanRequest extends FormRequest
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
            'modules.*.in' => 'Modul tersebut tidak terdaftar.',
        ];
    }
}
