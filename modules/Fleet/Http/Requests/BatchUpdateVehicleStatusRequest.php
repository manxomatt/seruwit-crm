<?php

namespace Modules\Fleet\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Modules\Fleet\Models\Vehicle;
use Modules\Maintenance\Support\WorkOrderShopHold;

class BatchUpdateVehicleStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['integer', 'distinct', 'exists:vehicles,id'],
            'status' => ['required', 'string', 'in:active,maintenance,retired,out_of_service'],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator): void {
            if ($validator->failed()) {
                return;
            }

            $status = $this->input('status');
            $ids = array_map('intval', (array) $this->input('ids', []));

            if ($status !== Vehicle::STATUS_MAINTENANCE && WorkOrderShopHold::inProgressVehicleIdsAmong($ids) !== []) {
                $validator->errors()->add('status', __('fleet.messages.vehicle_status_locked_by_work_order'));
            }

            if (! \App\Models\PlatformSetting::isPerVehicleTrialEnabled() && in_array($status, Vehicle::billableStatuses(), true)) {
                $tenant = tenant();
                if ($tenant instanceof \App\Models\Tenant && $tenant->hasFiniteLimit('max_vehicles')) {
                    $limit = (int) $tenant->planLimit('max_vehicles');
                    $ids = array_map('intval', (array) $this->input('ids', []));

                    $currentBillable = Vehicle::billable()->count();
                    $newlyBillable = Vehicle::whereIn('id', $ids)
                        ->whereNotIn('status', \Modules\Fleet\Models\Vehicle::billableStatuses())
                        ->count();

                    if (($currentBillable + $newlyBillable) > $limit) {
                        $validator->errors()->add('status', __('fleet.messages.limit_reached_vehicles', ['limit' => $limit]));
                    }
                }
            }
        });
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'ids.required' => __('fleet.validation.batch_ids_required'),
            'status.in' => __('fleet.validation.vehicle_status_invalid'),
        ];
    }
}
