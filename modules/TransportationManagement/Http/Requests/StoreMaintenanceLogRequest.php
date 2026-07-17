<?php

namespace Modules\TransportationManagement\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreMaintenanceLogRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'type' => ['required', 'string', 'in:scheduled_service,repair,inspection'],
            'description' => ['required', 'string', 'max:1000'],
            'scheduled_date' => ['required', 'date'],
            'completed_date' => ['nullable', 'date'],
            'cost' => ['nullable', 'numeric', 'min:0'],
            'odometer_km' => ['nullable', 'integer', 'min:0'],
            'status' => ['required', 'string', 'in:scheduled,completed,cancelled'],
        ];
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'type.in' => 'Select a valid maintenance type.',
            'status.in' => 'Select a valid maintenance status.',
        ];
    }
}
