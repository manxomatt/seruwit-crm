<?php

namespace Modules\Rental\Http\Requests\Mobile;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreMobileRentalBookingRequest extends FormRequest
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
            'vehicle_id' => ['required', 'integer', 'exists:vehicles,id'],
            'start_date' => ['required', 'date', 'after_or_equal:today'],
            'end_date' => ['required', 'date', 'after_or_equal:start_date'],
            'period_type' => ['required', 'string', Rule::in(['daily', 'weekly', 'monthly'])],
            'customer_name' => ['nullable', 'string', 'max:255'],
            'pickup_location_id' => ['nullable', 'integer', 'exists:locations,id'],
            'return_location_id' => ['nullable', 'integer', 'exists:locations,id'],
            'pickup_location' => ['nullable', 'string', 'max:255'],
            'return_location' => ['nullable', 'string', 'max:255'],
            'one_way_fee_amount' => ['nullable', 'numeric', 'min:0'],
            'insurance_package_id' => ['nullable', 'integer', 'exists:rental_insurance_packages,id'],
            'fuel_policy_notes' => ['nullable', 'string', 'max:1000'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
