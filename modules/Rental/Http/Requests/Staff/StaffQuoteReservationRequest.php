<?php

declare(strict_types=1);

namespace Modules\Rental\Http\Requests\Staff;

use Illuminate\Foundation\Http\FormRequest;

class StaffQuoteReservationRequest extends FormRequest
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
            'vehicle_id' => ['required', 'integer', 'exists:vehicles,id'],
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after_or_equal:start_date'],
            'period_type' => ['required', 'string', 'in:daily,weekly,monthly'],
            'service_type' => ['nullable', 'string', 'in:self_drive,with_driver'],
            'pickup_location_id' => ['nullable', 'integer'],
            'return_location_id' => ['nullable', 'integer'],
            'insurance_package_id' => ['nullable', 'integer', 'exists:rental_insurance_packages,id'],
            'delivery_type' => ['nullable', 'string', 'in:depot,airport,hotel,custom_address,hotel_custom'],
            'return_delivery_type' => ['nullable', 'string', 'in:depot,airport,hotel,custom_address,hotel_custom'],
            'discount_amount' => ['nullable', 'numeric', 'min:0'],
            'with_deposit' => ['nullable', 'boolean'],
        ];
    }
}
