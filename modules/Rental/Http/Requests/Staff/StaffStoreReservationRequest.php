<?php

declare(strict_types=1);

namespace Modules\Rental\Http\Requests\Staff;

use Illuminate\Foundation\Http\FormRequest;

class StaffStoreReservationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, list<string>>
     */
    public function rules(): array
    {
        return [
            'partner_id' => ['required', 'integer', 'exists:partners,id'],
            'vehicle_id' => ['required', 'integer', 'exists:vehicles,id'],
            'start_date' => ['required', 'date'],
            'pickup_time' => ['nullable', 'string', 'max:10'],
            'end_date' => ['required', 'date', 'after_or_equal:start_date'],
            'return_time' => ['nullable', 'string', 'max:10'],
            'period_type' => ['required', 'string', 'in:daily,weekly,monthly'],
            'service_type' => ['nullable', 'string', 'in:self_drive,with_driver'],
            'pickup_location_id' => ['nullable', 'integer'],
            'return_location_id' => ['nullable', 'integer'],
            'pickup_location' => ['nullable', 'string', 'max:255'],
            'return_location' => ['nullable', 'string', 'max:255'],
            'insurance_package_id' => ['nullable', 'integer', 'exists:rental_insurance_packages,id'],
            'delivery_type' => ['nullable', 'string', 'in:depot,airport,hotel,custom_address,hotel_custom'],
            'delivery_address' => ['nullable', 'string', 'max:255'],
            'return_delivery_type' => ['nullable', 'string', 'in:depot,airport,hotel,custom_address,hotel_custom'],
            'return_delivery_address' => ['nullable', 'string', 'max:255'],
            'discount_amount' => ['nullable', 'numeric', 'min:0'],
            'custom_rate_per_period' => ['nullable', 'numeric', 'min:0'],
            'fuel_policy_notes' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string', 'max:1000'],
            'status' => ['nullable', 'string', 'in:draft,pending,pending_reserved,confirmed'],
        ];
    }
}
