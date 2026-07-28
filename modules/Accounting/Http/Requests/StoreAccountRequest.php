<?php

namespace Modules\Accounting\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Modules\Accounting\Models\Account;

class StoreAccountRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'parent_id' => $this->filled('parent_id') ? $this->input('parent_id') : null,
            'system_role' => $this->filled('system_role') ? $this->input('system_role') : null,
            'normal_balance' => $this->filled('normal_balance') ? $this->input('normal_balance') : null,
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'code' => ['required', 'string', 'max:32', 'unique:accounts,code'],
            'name' => ['required', 'string', 'max:255'],
            'type' => ['required', 'string', Rule::in(Account::TYPES)],
            'parent_id' => ['nullable', 'integer', 'exists:accounts,id'],
            'is_postable' => ['sometimes', 'boolean'],
            'is_active' => ['sometimes', 'boolean'],
            'normal_balance' => ['nullable', 'string', Rule::in([Account::NORMAL_DEBIT, Account::NORMAL_CREDIT])],
            'currency' => ['nullable', 'string', 'size:3'],
            'system_role' => ['nullable', 'string', 'max:64'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'code.unique' => __('accounting.validation.code_unique'),
            'type.in' => __('accounting.validation.type_invalid'),
        ];
    }
}
