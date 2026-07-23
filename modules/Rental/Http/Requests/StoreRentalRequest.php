<?php

namespace Modules\Rental\Http\Requests;

use App\Modules\Facades\Modules;
use Illuminate\Foundation\Http\FormRequest;
use Modules\Fleet\Models\Vehicle;
use Modules\Rental\Models\Rental;

class StoreRentalRequest extends FormRequest
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
            $vehicle = Vehicle::find($this->vehicle_id);

            if (! $vehicle) {
                return;
            }

            $reasons = Rental::vehicleAvailabilityReasons(
                $vehicle,
                $this->start_date,
                $this->end_date,
            );

            // Check Transportation conflicts when that module is installed
            if (Modules::available('transportation') && $this->start_date) {
                foreach ($this->tripDatesInRange() as $date) {
                    if (\Modules\TransportationManagement\Models\Trip::hasActiveTripOn('vehicle_id', $vehicle->id, $date)) {
                        $reasons[] = "Vehicle {$vehicle->name} already has a trip on {$date}.";
                        break;
                    }
                }
            }

            foreach ($reasons as $reason) {
                $v->errors()->add('vehicle_id', $reason);
            }
        });
    }

    /**
     * All calendar dates covered by the booking window.
     *
     * @return list<string>
     */
    private function tripDatesInRange(): array
    {
        if (! $this->start_date || ! $this->end_date) {
            return [];
        }

        $dates = [];
        $current = \Carbon\Carbon::parse($this->start_date);
        $end = \Carbon\Carbon::parse($this->end_date);

        while ($current->lte($end)) {
            $dates[] = $current->toDateString();
            $current->addDay();
        }

        return $dates;
    }
}
