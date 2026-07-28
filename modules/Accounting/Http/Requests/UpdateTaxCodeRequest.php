<?php

namespace Modules\Accounting\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Modules\Accounting\Models\TaxCode;

class UpdateTaxCodeRequest extends FormRequest
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
        $taxCode = $this->route('taxCode');

        return [
            'code' => [
                'required',
                'string',
                'max:32',
                Rule::unique('tax_codes', 'code')->ignore($taxCode?->id),
            ],
            'name' => ['required', 'string', 'max:255'],
            'category' => ['required', 'string', Rule::in(TaxCode::CATEGORIES)],
            'rate' => ['required', 'numeric', 'min:0', 'max:100'],
            'calculation' => ['required', 'string', Rule::in(TaxCode::CALCULATIONS)],
            'direction' => ['required', 'string', Rule::in(TaxCode::DIRECTIONS)],
            'output_account_id' => ['nullable', 'integer', 'exists:accounts,id'],
            'input_account_id' => ['nullable', 'integer', 'exists:accounts,id'],
            'wht_account_id' => ['nullable', 'integer', 'exists:accounts,id'],
            'is_default' => ['sometimes', 'boolean'],
            'is_active' => ['sometimes', 'boolean'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
