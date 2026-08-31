<?php

namespace Modules\Rental\Http\Requests\Mobile;

use Illuminate\Foundation\Http\FormRequest;

class RequestRentalExtensionRequest extends FormRequest
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
            'new_end_date' => ['required', 'date', 'after:today'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
