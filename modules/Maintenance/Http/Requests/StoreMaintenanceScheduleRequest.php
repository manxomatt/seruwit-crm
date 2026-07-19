<?php

namespace Modules\Maintenance\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreMaintenanceScheduleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, array<int, mixed>|string>
     */
    public function rules(): array
    {
        return [
            'vehicle_id' => ['required', 'exists:vehicles,id'],
            'category_id' => ['required', 'exists:maintenance_categories,id'],
            'name' => ['required', 'string', 'max:255'],
            'interval_type' => ['required', 'string', 'in:mileage,calendar'],
            'interval_value' => ['required', 'integer', 'min:1'],
            'last_service_odometer' => ['nullable', 'integer', 'min:0'],
            'last_service_date' => ['nullable', 'date'],
            'is_active' => ['boolean'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
