<?php

namespace Modules\Fleet\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class BatchUpdateDriverStatusRequest extends FormRequest
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
            'ids.*' => ['integer', 'distinct', 'exists:drivers,id'],
            'status' => ['required', 'string', 'in:available,on_trip,off_duty,inactive'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'ids.required' => __('fleet.validation.batch_ids_required'),
            'status.in' => __('fleet.validation.driver_status_invalid'),
        ];
    }
}
