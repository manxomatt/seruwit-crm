<?php

namespace Modules\Fleet\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreDriverRequest extends FormRequest
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
            'name' => ['required', 'string', 'max:255'],
            'license_number' => ['required', 'string', 'max:50', 'unique:drivers,license_number'],
            'license_type' => ['nullable', 'string', 'max:20'],
            'license_expires_at' => ['nullable', 'date'],
            'phone' => ['required', 'string', 'max:30'],
            'email' => ['nullable', 'email', 'max:255'],
            'status' => ['required', 'string', 'in:available,on_trip,off_duty,inactive'],
            'photo_url' => ['nullable', 'string', 'max:2048'],
            'notes' => ['nullable', 'string', 'max:2000'],
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
            'license_number.required' => 'The driving license number is required.',
            'license_number.unique' => 'This license number is already registered.',
            'status.in' => 'Select a valid driver status.',
        ];
    }
}
