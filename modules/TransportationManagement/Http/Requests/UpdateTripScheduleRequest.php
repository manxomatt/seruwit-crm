<?php

namespace Modules\TransportationManagement\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateTripScheduleRequest extends FormRequest
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
            'vehicle_id' => ['sometimes', 'required', 'integer', 'exists:vehicles,id'],
            'driver_id' => ['sometimes', 'required', 'integer', 'exists:drivers,id'],
            'origin' => ['sometimes', 'required', 'string', 'max:255'],
            'destination' => ['sometimes', 'required', 'string', 'max:255'],
            'cargo_notes' => ['nullable', 'string', 'max:2000'],
            'distance_km' => ['nullable', 'numeric', 'min:0'],
            'days_of_week' => ['sometimes', 'required', 'array', 'min:1'],
            'days_of_week.*' => ['integer', 'between:0,6'],
            'time_of_day' => ['sometimes', 'required', 'date_format:H:i'],
            'starts_on' => ['sometimes', 'required', 'date'],
            'ends_on' => ['nullable', 'date', 'after_or_equal:starts_on'],
            'is_active' => ['boolean'],
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
            'days_of_week.required' => 'Select at least one day of the week.',
            'days_of_week.min' => 'Select at least one day of the week.',
            'ends_on.after_or_equal' => 'The end date must be on or after the start date.',
        ];
    }
}
