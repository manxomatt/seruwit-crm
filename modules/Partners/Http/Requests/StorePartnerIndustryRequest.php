<?php

namespace Modules\Partners\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Modules\Partners\Models\PartnerIndustry;

class StorePartnerIndustryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'name' => PartnerIndustry::normalizeTranslations($this->input('name')),
            'description' => PartnerIndustry::normalizeTranslations($this->input('description')) ?: null,
            'code' => filled($this->input('code')) ? strtolower(trim((string) $this->input('code'))) : null,
        ]);
    }

    /**
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'code' => ['nullable', 'string', 'max:50', 'alpha_dash', Rule::unique('partner_industries', 'code')->ignore($this->ignoreId())],
            'name' => ['required', 'array'],
            'name.id' => [
                'required',
                'string',
                'max:255',
                Rule::unique('partner_industries', 'name->id')->ignore($this->ignoreId()),
            ],
            'name.en' => [
                'required',
                'string',
                'max:255',
                Rule::unique('partner_industries', 'name->en')->ignore($this->ignoreId()),
            ],
            'description' => ['nullable', 'array'],
            'description.id' => ['nullable', 'string', 'max:2000'],
            'description.en' => ['nullable', 'string', 'max:2000'],
            'is_active' => ['boolean'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'name.id.required' => __('partners.validation.industry_name_id_required'),
            'name.en.required' => __('partners.validation.industry_name_en_required'),
            'name.id.unique' => __('partners.validation.industry_name_unique'),
            'name.en.unique' => __('partners.validation.industry_name_unique'),
        ];
    }

    protected function ignoreId(): ?int
    {
        return null;
    }
}
