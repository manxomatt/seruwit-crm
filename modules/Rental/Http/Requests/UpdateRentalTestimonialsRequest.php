<?php

namespace Modules\Rental\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateRentalTestimonialsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, list<\Illuminate\Contracts\Validation\ValidationRule|string>>
     */
    public function rules(): array
    {
        return [
            'testimonials' => ['present', 'array', 'max:50'],
            'testimonials.*.author' => ['required', 'string', 'max:120'],
            'testimonials.*.location' => ['nullable', 'string', 'max:120'],
            'testimonials.*.rating' => ['required', 'integer', 'min:1', 'max:5'],
            'testimonials.*.body' => ['required', 'string', 'max:1000'],
            'testimonials.*.published' => ['sometimes', 'boolean'],
        ];
    }
}
