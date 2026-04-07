<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreCarouselRequest extends FormRequest
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
            'slug' => ['required', 'string', 'max:255', 'unique:carousels,slug'],
            'description' => ['nullable', 'string', 'max:1000'],
            'is_active' => ['boolean'],
            'autoplay_interval' => ['integer', 'min:1000', 'max:30000'],
            'show_navigation' => ['boolean'],
            'show_indicators' => ['boolean'],
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
            'name.required' => 'The carousel name is required.',
            'name.max' => 'The carousel name must not exceed 255 characters.',
            'slug.required' => 'The carousel slug is required.',
            'slug.unique' => 'This slug is already in use.',
            'autoplay_interval.min' => 'The autoplay interval must be at least 1000ms.',
            'autoplay_interval.max' => 'The autoplay interval must not exceed 30000ms.',
        ];
    }
}
