<?php

namespace Modules\Partners\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class BatchUpdatePartnerStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['integer', 'distinct', 'exists:partners,id'],
            'status' => ['required', 'string', 'in:active,inactive'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'ids.required' => __('partners.validation.batch_ids_required'),
            'status.in' => __('partners.validation.status_in'),
        ];
    }
}
