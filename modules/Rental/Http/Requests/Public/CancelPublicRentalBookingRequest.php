<?php

namespace Modules\Rental\Http\Requests\Public;

use Illuminate\Foundation\Http\FormRequest;

class CancelPublicRentalBookingRequest extends FormRequest
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
            'booker_phone' => ['required', 'string', 'max:32'],
            'otp_code' => ['required', 'string', 'size:6'],
            'cancelled_reason' => ['required', 'string', 'max:500'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'booker_phone.required' => __('rental.public.validation.booker_phone_required'),
            'otp_code.required' => __('rental.public.validation.otp_required'),
            'otp_code.size' => __('rental.public.validation.otp_size'),
            'cancelled_reason.required' => __('rental.public.validation.cancel_reason_required'),
        ];
    }
}
