<?php

namespace Modules\TransportationManagement\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreFuelLogRequest extends FormRequest
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
            'trip_id' => ['nullable', 'integer', 'exists:trips,id'],
            'filled_at' => ['required', 'date'],
            'liters' => ['required', 'numeric', 'min:0.01'],
            'cost' => ['required', 'numeric', 'min:0'],
            'odometer_km' => ['nullable', 'integer', 'min:0'],
        ];
    }
}
