<?php

namespace Modules\Rental\Http\Requests\Public;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StorePublicRentalBookingRequest extends FormRequest
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
        $phone = $this->input('booker_phone') ?? '';
        $isVerified = $phone !== '' && app(\Modules\Shuttle\Support\PassengerOtpService::class)->isVerified($phone);

        return [
            'vehicle_id' => ['required', 'integer', 'exists:vehicles,id'],
            'start_date' => ['required', 'date', 'after_or_equal:today'],
            'end_date' => ['required', 'date', 'after_or_equal:start_date'],
            'period_type' => ['required', 'string', Rule::in(['daily', 'weekly', 'monthly'])],
            'customer_name' => ['required', 'string', 'max:120'],
            'customer_email' => ['nullable', 'email', 'max:255'],
            'booker_phone' => ['required', 'string', 'max:32'],
            'otp_code' => [$isVerified ? 'nullable' : 'required', 'string', 'size:6'],
            'pickup_location_id' => app(\Modules\Rental\Support\RentalLocationHydrator::class)->depotIdRules(),
            'return_location_id' => app(\Modules\Rental\Support\RentalLocationHydrator::class)->depotIdRules(),
            'pickup_fleet_base_id' => app(\Modules\Rental\Support\RentalLocationHydrator::class)->depotIdRules(),
            'return_fleet_base_id' => app(\Modules\Rental\Support\RentalLocationHydrator::class)->depotIdRules(),
            'insurance_package_id' => ['nullable', 'integer', 'exists:rental_insurance_packages,id'],
            'with_deposit' => ['nullable', 'boolean'],
            'deposit_amount' => ['nullable', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string', 'max:1000'],
            'idempotency_key' => ['nullable', 'uuid'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'customer_name.required' => __('rental.public.validation.customer_name_required'),
            'booker_phone.required' => __('rental.public.validation.booker_phone_required'),
            'otp_code.required' => __('rental.public.validation.otp_required'),
            'otp_code.size' => __('rental.public.validation.otp_size'),
            'vehicle_id.required' => __('rental.public.validation.vehicle_required'),
            'start_date.required' => __('rental.public.validation.start_date_required'),
            'end_date.required' => __('rental.public.validation.end_date_required'),
        ];
    }
}
