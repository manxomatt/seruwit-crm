<?php

namespace Modules\Rental\Http\Requests\Mobile;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Modules\Fleet\Support\VehicleRentalClass;

class QuoteMobileRentalRequest extends FormRequest
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
            'pickup_location_id' => ['nullable', 'integer', 'exists:locations,id'],
            'return_location_id' => ['nullable', 'integer', 'exists:locations,id'],
            'one_way_fee_amount' => ['nullable', 'numeric', 'min:0'],
            'insurance_package_id' => ['nullable', 'integer', 'exists:rental_insurance_packages,id'],
            'rental_class' => ['nullable', 'string', Rule::in(VehicleRentalClass::values())],
        ];
    }
}
