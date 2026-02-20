<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateLiveUpdateRequest extends FormRequest
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
            'title' => ['sometimes', 'required', 'string', 'max:255'],
            'content' => ['sometimes', 'required', 'string'],
            'type' => ['sometimes', 'required', 'string', 'in:info,success,warning,error'],
            'is_active' => ['sometimes', 'boolean'],
            'published_at' => ['nullable', 'date'],
        ];
    }

    /**
     * Get custom error messages for validation rules.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'title.required' => 'The title is required.',
            'title.max' => 'The title must not exceed 255 characters.',
            'content.required' => 'The content is required.',
            'type.required' => 'The type is required.',
            'type.in' => 'The type must be one of: info, success, warning, error.',
        ];
    }
}
