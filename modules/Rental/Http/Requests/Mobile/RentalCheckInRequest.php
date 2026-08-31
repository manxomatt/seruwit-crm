<?php

namespace Modules\Rental\Http\Requests\Mobile;

use Illuminate\Foundation\Http\FormRequest;

class RentalCheckInRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'terms_agreed' => ['required', 'boolean', 'accepted'],
            'customer_signature' => ['required', 'string', 'starts_with:data:image/'],
            'pickup_notes' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
