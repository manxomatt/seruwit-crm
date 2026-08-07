<?php

namespace Modules\Rental\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Modules\Rental\Support\RentalBookingPolicy;

class UpdateRentalGeneralSettingsRequest extends FormRequest
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
        $feeTypes = [RentalBookingPolicy::FEE_TYPE_FIXED, RentalBookingPolicy::FEE_TYPE_PERCENT];

        return [
            'default_one_way_fee' => ['required', 'numeric', 'min:0'],
            'passenger_booking_enabled' => ['required', 'boolean'],
            'pending_reserved_ttl_minutes' => ['required', 'integer', 'min:1', 'max:10080'],
            'cancellation_fee_type' => ['required', Rule::in($feeTypes)],
            'cancellation_fee_amount' => ['required', 'numeric', 'min:0'],
            'no_show_fee_type' => ['required', Rule::in($feeTypes)],
            'no_show_fee_amount' => ['required', 'numeric', 'min:0'],
            'calendar_click_to_book' => ['required', 'boolean'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'default_one_way_fee.required' => __('rental.validation.default_one_way_fee_required'),
            'passenger_booking_enabled.required' => __('rental.validation.passenger_booking_enabled_required'),
            'pending_reserved_ttl_minutes.required' => __('rental.validation.pending_reserved_ttl_required'),
            'cancellation_fee_type.required' => __('rental.validation.cancellation_fee_type_required'),
            'cancellation_fee_amount.required' => __('rental.validation.cancellation_fee_amount_required'),
            'no_show_fee_type.required' => __('rental.validation.no_show_fee_type_required'),
            'no_show_fee_amount.required' => __('rental.validation.no_show_fee_amount_required'),
            'calendar_click_to_book.required' => __('rental.validation.calendar_click_to_book_required'),
        ];
    }
}
