<?php

namespace Modules\Fleet\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class BatchDeleteFleetBasesRequest extends FormRequest
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
            'ids.*' => ['integer', 'distinct', 'exists:fleet_bases,id'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'ids.required' => __('fleet.validation.batch_ids_required'),
        ];
    }
}
