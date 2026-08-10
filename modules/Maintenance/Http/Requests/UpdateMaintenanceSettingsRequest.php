<?php

namespace Modules\Maintenance\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateMaintenanceSettingsRequest extends FormRequest
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
            'alert_km_before' => ['required', 'integer', 'min:0', 'max:100000'],
            'alert_days_before' => ['required', 'integer', 'min:0', 'max:3650'],
            'auto_create_wo' => ['required', 'boolean'],
            'single_active_wo_per_vehicle' => ['required', 'boolean'],
            'single_active_wo_per_bay' => ['required', 'boolean'],
        ];
    }
}
