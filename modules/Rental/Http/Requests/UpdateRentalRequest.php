<?php

namespace Modules\Rental\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Modules\Fleet\Models\Vehicle;
use Modules\Rental\Models\Rental;

class UpdateRentalRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'vehicle_id' => ['required', 'exists:vehicles,id'],
            'driver_id' => ['nullable', 'exists:drivers,id'],
            'partner_id' => ['required', 'exists:partners,id'],
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after_or_equal:start_date'],
            'period_type' => ['required', 'in:daily,weekly,monthly'],
            'rate_per_period' => ['required', 'numeric', 'min:0'],
            'km_limit_per_period' => ['nullable', 'integer', 'min:0'],
            'excess_km_rate' => ['nullable', 'numeric', 'min:0'],
            'deposit_amount' => ['nullable', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string'],
        ];
    }

    public function withValidator(\Illuminate\Validation\Validator $validator): void
    {
        $validator->after(function (\Illuminate\Validation\Validator $v): void {
            $rental = $this->route('rental');
            $vehicle = Vehicle::find($this->vehicle_id);

            if (! $vehicle || ! $rental) {
                return;
            }

            $reasons = Rental::vehicleAvailabilityReasons(
                $vehicle,
                $this->start_date,
                $this->end_date,
                $rental->id,
            );

            foreach ($reasons as $reason) {
                $v->errors()->add('vehicle_id', $reason);
            }
        });
    }
}
