<?php

namespace Modules\Partners\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Modules\Partners\Models\PartnerType;

class StorePartnerTypeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'name' => PartnerType::normalizeTranslations($this->input('name')),
            'description' => PartnerType::normalizeTranslations($this->input('description')) ?: null,
            'code' => filled($this->input('code')) ? strtolower(trim((string) $this->input('code'))) : null,
        ]);
    }

    /**
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'code' => ['required', 'string', 'max:50', 'alpha_dash', Rule::unique('partner_types', 'code')->ignore($this->ignoreId())],
            'name' => ['required', 'array'],
            'name.id' => [
                'required',
                'string',
                'max:255',
                Rule::unique('partner_types', 'name->id')->ignore($this->ignoreId()),
            ],
            'name.en' => [
                'required',
                'string',
                'max:255',
                Rule::unique('partner_types', 'name->en')->ignore($this->ignoreId()),
            ],
            'description' => ['nullable', 'array'],
            'description.id' => ['nullable', 'string', 'max:2000'],
            'description.en' => ['nullable', 'string', 'max:2000'],
            'affects_customer_rank' => ['boolean'],
            'affects_supplier_rank' => ['boolean'],
            'is_active' => ['boolean'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'code.required' => __('partners.validation.type_code_required'),
            'name.id.required' => __('partners.validation.type_name_id_required'),
            'name.en.required' => __('partners.validation.type_name_en_required'),
            'name.id.unique' => __('partners.validation.type_name_unique'),
            'name.en.unique' => __('partners.validation.type_name_unique'),
        ];
    }

    protected function ignoreId(): ?int
    {
        return null;
    }
}
