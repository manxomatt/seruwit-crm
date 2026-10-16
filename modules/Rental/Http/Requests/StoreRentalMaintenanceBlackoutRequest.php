<?php

namespace Modules\Rental\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;
use Modules\Rental\Models\Rental;
use Modules\Rental\Models\RentalMaintenanceBlackout;

class StoreRentalMaintenanceBlackoutRequest extends FormRequest
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
            'vendor_partner_id' => ['nullable', 'integer', 'exists:partners,id'],
            'workshop_name' => ['nullable', 'string', 'max:191'],
            'reason' => ['required', 'string', 'max:191'],
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after_or_equal:start_date'],
            'status' => ['required', 'in:scheduled,in_progress,completed,cancelled'],
            'estimated_cost' => ['nullable', 'numeric', 'min:0'],
            'actual_cost' => ['nullable', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string'],
            'create_work_order' => ['nullable', 'boolean'],
            'set_vehicle_maintenance_status' => ['nullable', 'boolean'],
        ];
    }

    public function after(): array
    {
        return [
            function (Validator $validator): void {
                $vehicleId = (int) $this->input('vehicle_id');
                $start = (string) $this->input('start_date');
                $end = (string) $this->input('end_date');
                $status = (string) $this->input('status');

                if ($vehicleId > 0 && $start && $end && in_array($status, [RentalMaintenanceBlackout::STATUS_SCHEDULED, RentalMaintenanceBlackout::STATUS_IN_PROGRESS], true)) {
                    $overlapping = RentalMaintenanceBlackout::findOverlappingBlackout($vehicleId, $start, $end);
                    if ($overlapping) {
                        $validator->errors()->add('start_date', 'Armada sudah memiliki jadwal servis/blackout aktif pada periode tersebut ('.$overlapping->code.').');
                    }

                    if (Rental::hasOverlapFor($vehicleId, $start, $end)) {
                        $validator->errors()->add('start_date', 'Armada sedang memiliki booking rental aktif pada rentang tanggal tersebut. Mohon periksa atau jadwalkan ulang booking rental terkait terlebih dahulu.');
                    }
                }
            },
        ];
    }
}
