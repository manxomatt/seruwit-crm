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
        $token = $this->route('token');
        $rental = \Modules\Rental\Models\Rental::where('public_token', $token)->first();
        $phone = $this->input('booker_phone') ?: ($rental?->booker_phone ?? '');
        $isVerified = $phone !== '' && app(\Modules\Shuttle\Support\PassengerOtpService::class)->isVerified($phone);

        return [
            'booker_phone' => [$isVerified ? 'nullable' : 'required', 'string', 'max:32'],
            'otp_code' => [$isVerified ? 'nullable' : 'required', 'string', 'size:6'],
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
