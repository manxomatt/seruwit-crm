<?php

namespace Modules\Shuttle\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreScheduleRequest extends FormRequest
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
            'corridor_id' => ['required', 'exists:shuttle_corridors,id'],
            'code' => ['required', 'string', 'max:50', 'unique:shuttle_schedules,code'],
            'days_of_week' => ['required', 'array', 'min:1'],
            'days_of_week.*' => ['integer', 'between:1,7'],
            'departure_time' => ['required', 'date_format:H:i'],
            'vehicle_id' => ['nullable', 'exists:vehicles,id'],
            'driver_id' => ['nullable', 'exists:drivers,id'],
            'seat_capacity' => ['required', 'integer', 'min:1', 'max:100'],
            'pickup_cutoff_minutes' => ['nullable', 'integer', 'min:0'],
            'starts_on' => ['nullable', 'date'],
            'ends_on' => ['nullable', 'date', 'after_or_equal:starts_on'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('is_active')) {
            $this->merge(['is_active' => filter_var($this->is_active, FILTER_VALIDATE_BOOLEAN)]);
        }

        $this->merge([
            'vehicle_id' => $this->vehicle_id ?: null,
            'driver_id' => $this->driver_id ?: null,
            'starts_on' => $this->starts_on ?: null,
            'ends_on' => $this->ends_on ?: null,
        ]);
    }
}
