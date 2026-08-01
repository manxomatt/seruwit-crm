<?php

namespace Modules\Shuttle\Http\Requests\Mobile;

use Illuminate\Foundation\Http\FormRequest;

class CancelMobileTicketRequest extends FormRequest
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
            'cancel_reason' => ['nullable', 'string', 'max:500'],
        ];
    }
}
