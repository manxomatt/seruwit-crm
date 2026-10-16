<?php

namespace Modules\Rental\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;
use Modules\Rental\Models\RentalMaintenanceBlackout;

class UpdateRentalMaintenanceBlackoutRequest extends FormRequest
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
            'vendor_partner_id' => ['nullable', 'integer', 'exists:partners,id'],
            'workshop_name' => ['nullable', 'string', 'max:191'],
            'reason' => ['required', 'string', 'max:191'],
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after_or_equal:start_date'],
            'status' => ['required', 'in:scheduled,in_progress,completed,cancelled'],
            'estimated_cost' => ['nullable', 'numeric', 'min:0'],
            'actual_cost' => ['nullable', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string'],
        ];
    }

    public function after(): array
    {
        return [
            function (Validator $validator): void {
                /** @var RentalMaintenanceBlackout|null $blackout */
                $blackout = $this->route('blackout');
                if (! $blackout) {
                    return;
                }

                $start = (string) $this->input('start_date');
                $end = (string) $this->input('end_date');
                $status = (string) $this->input('status');

                if ($start && $end && in_array($status, [RentalMaintenanceBlackout::STATUS_SCHEDULED, RentalMaintenanceBlackout::STATUS_IN_PROGRESS], true)) {
                    $overlapping = RentalMaintenanceBlackout::findOverlappingBlackout($blackout->vehicle_id, $start, $end, $blackout->id);
                    if ($overlapping) {
                        $validator->errors()->add('start_date', 'Armada sudah memiliki jadwal servis/blackout aktif lain pada periode tersebut ('.$overlapping->code.').');
                    }
                }
            },
        ];
    }
}
