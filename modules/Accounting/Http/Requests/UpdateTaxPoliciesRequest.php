<?php

namespace Modules\Accounting\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Modules\Accounting\Models\TaxCode;
use Modules\Accounting\Support\TaxChannels;

class UpdateTaxPoliciesRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->hasPermissionFor('accounting', 'manage_tax') ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'policies' => ['required', 'array'],
            'policies.*.channel' => ['required', 'string', Rule::in(TaxChannels::all())],
            'policies.*.tax_code_id' => [
                'nullable',
                'integer',
                Rule::exists('tax_codes', 'id')->where(function ($query): void {
                    $query->where('is_active', true)
                        ->whereIn('category', [TaxCode::CATEGORY_PPN, TaxCode::CATEGORY_NONE]);
                }),
            ],
        ];
    }
}
