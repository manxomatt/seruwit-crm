<?php

namespace Modules\Partners\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\Rule;

class UpdatePartnerRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        if ($this->input('portal_user_id') === '' || $this->input('portal_user_id') === null) {
            $this->merge(['portal_user_id' => null]);
        }
    }

    /** @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string> */
    public function rules(): array
    {
        return [
            'account_type' => ['sometimes', 'required', 'string', 'in:company,individual'],
            'sub_type' => ['nullable', 'string', 'in:customer,supplier,other'],
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:30'],
            'mobile' => ['nullable', 'string', 'max:30'],
            'job_title' => ['nullable', 'string', 'max:255'],
            'website' => ['nullable', 'string', 'max:255'],
            'tax_id' => ['nullable', 'string', 'max:50'],
            'id_number' => ['nullable', 'string', 'max:50'],
            'license_number' => ['nullable', 'string', 'max:50'],
            'license_expires_at' => ['nullable', 'date'],
            'company_registry' => ['nullable', 'string', 'max:100'],
            'reference' => ['nullable', 'string', 'max:100'],
            'parent_id' => ['nullable', 'exists:partners,id'],
            'industry_id' => ['nullable', 'exists:partner_industries,id'],
            'title_id' => ['nullable', 'exists:partner_titles,id'],
            'is_customer' => ['boolean'],
            'is_supplier' => ['boolean'],
            'credit_limit' => ['nullable', 'numeric', 'min:0'],
            'payment_term_days' => ['nullable', 'integer', 'min:0', 'max:365'],
            'price_list_id' => array_values(array_filter([
                'nullable',
                'integer',
                Schema::hasTable('price_lists') ? Rule::exists('price_lists', 'id') : null,
            ])),
            'address' => ['nullable', 'string', 'max:2000'],
            'notes' => ['nullable', 'string', 'max:2000'],
            'comment' => ['nullable', 'string', 'max:5000'],
            'status' => ['sometimes', 'required', 'string', 'in:active,inactive'],
            'is_blacklisted' => ['boolean'],
            'blacklist_reason' => ['nullable', 'string', 'max:500'],
            'portal_user_id' => ['nullable', 'integer', 'exists:users,id'],
            'tag_ids' => ['nullable', 'array'],
            'tag_ids.*' => ['exists:partner_tags,id'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'account_type.in' => __('partners.validation.account_type_in'),
            'status.in' => __('partners.validation.status_in'),
        ];
    }
}
