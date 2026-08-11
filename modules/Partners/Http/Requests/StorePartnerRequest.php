<?php

namespace Modules\Partners\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\Rule;

class StorePartnerRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string> */
    public function rules(): array
    {
        return [
            'account_type' => ['required', 'string', 'in:company,individual'],
            'name' => ['required', 'string', 'max:255'],
            'picture_url' => ['nullable', 'string', 'max:2048'],
            'email' => ['nullable', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:30'],
            'mobile' => ['nullable', 'string', 'max:30'],
            'job_title' => ['nullable', 'string', 'max:255'],
            'website' => ['nullable', 'string', 'max:255'],
            'tax_id' => ['nullable', 'string', 'max:50'],
            'company_registry' => ['nullable', 'string', 'max:100'],
            'reference' => ['nullable', 'string', 'max:100'],
            'parent_id' => ['nullable', 'exists:partners,id'],
            'industry_id' => ['nullable', 'exists:partner_industries,id'],
            'title_id' => ['nullable', 'exists:partner_titles,id'],
            'type_ids' => ['nullable', 'array'],
            'type_ids.*' => ['exists:partner_types,id'],
            'credit_limit' => ['nullable', 'numeric', 'min:0'],
            'price_list_id' => array_values(array_filter([
                'nullable',
                'integer',
                Schema::hasTable('price_lists') ? Rule::exists('price_lists', 'id') : null,
            ])),
            'address' => ['nullable', 'string', 'max:2000'],
            'notes' => ['nullable', 'string', 'max:2000'],
            'comment' => ['nullable', 'string', 'max:5000'],
            'status' => ['required', 'string', 'in:active,inactive'],
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
