<?php

namespace Modules\Partners\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdatePartnerRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
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
            'company_registry' => ['nullable', 'string', 'max:100'],
            'reference' => ['nullable', 'string', 'max:100'],
            'parent_id' => ['nullable', 'exists:partners,id'],
            'industry_id' => ['nullable', 'exists:partner_industries,id'],
            'title_id' => ['nullable', 'exists:partner_titles,id'],
            'is_customer' => ['boolean'],
            'is_supplier' => ['boolean'],
            'credit_limit' => ['nullable', 'numeric', 'min:0'],
            'address' => ['nullable', 'string', 'max:2000'],
            'notes' => ['nullable', 'string', 'max:2000'],
            'comment' => ['nullable', 'string', 'max:5000'],
            'status' => ['sometimes', 'required', 'string', 'in:active,inactive'],
            'tag_ids' => ['nullable', 'array'],
            'tag_ids.*' => ['exists:partner_tags,id'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'account_type.in' => 'Tipe akun harus perusahaan atau individu.',
            'status.in' => 'Pilih status yang valid.',
        ];
    }
}
