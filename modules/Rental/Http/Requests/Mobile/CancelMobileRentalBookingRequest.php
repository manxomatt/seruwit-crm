<?php

namespace Modules\Rental\Http\Requests\Mobile;

use Illuminate\Foundation\Http\FormRequest;

class CancelMobileRentalBookingRequest extends FormRequest
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
            'cancelled_reason' => ['required', 'string', 'max:500'],
        ];
    }
}
