<?php

namespace Modules\Fleet\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Modules\Fleet\Models\Vehicle;
use Modules\Fleet\Support\AccessibleFleetBases;
use Modules\Fleet\Support\VehicleRentalClass;
use Modules\Maintenance\Support\WorkOrderShopHold;

class UpdateVehicleRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'plate_number' => ['sometimes', 'required', 'string', 'max:20', Rule::unique('vehicles')->ignore($this->route('vehicle'))],
            'type' => ['sometimes', 'required', 'string', 'in:car,truck,van,motorcycle,bus'],
            'rental_class' => ['nullable', 'string', Rule::in(VehicleRentalClass::values())],
            'brand' => ['nullable', 'string', 'max:255'],
            'model_year' => ['nullable', 'integer', 'min:1980', 'max:'.(now()->year + 1)],
            'color' => ['nullable', 'string', 'max:100'],
            'capacity' => ['nullable', 'string', 'max:100'],
            'capacity_kg' => ['nullable', 'numeric', 'min:0'],
            'capacity_seats' => ['nullable', 'integer', 'min:1', 'max:100'],
            'cost_per_km' => ['nullable', 'numeric', 'min:0'],
            'tank_capacity_liters' => ['nullable', 'numeric', 'min:0'],
            'expected_km_per_liter' => ['nullable', 'numeric', 'min:0'],
            'fuel_type' => ['sometimes', 'required', 'string', 'in:petrol,diesel,electric,hybrid'],
            'status' => ['sometimes', 'required', 'string', 'in:active,maintenance,retired,out_of_service'],
            'home_base_id' => ['nullable', 'integer', 'exists:fleet_bases,id'],
            'ownership_type' => ['sometimes', 'required', 'string', 'in:owned,investor,partner_loan'],
            'partner_id' => ['nullable', 'required_if:ownership_type,investor,partner_loan', 'integer', 'exists:partners,id'],
            'contract_number' => ['nullable', 'string', 'max:100'],
            'contract_start_date' => ['nullable', 'date'],
            'contract_end_date' => ['nullable', 'date', 'after_or_equal:contract_start_date'],
            'settlement_scheme' => ['nullable', 'string', 'in:revenue_share,fixed_monthly,daily_rental'],
            'revenue_share_owner_pct' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'revenue_share_tenant_pct' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'fixed_fee_amount' => ['nullable', 'numeric', 'min:0'],
            'maintenance_payer' => ['nullable', 'string', 'in:tenant,owner,shared'],
            'odometer_km' => ['integer', 'min:0'],
            'stnk_expires_at' => ['nullable', 'date'],
            'stnk_five_year_expires_at' => ['nullable', 'date'],
            'insurance_provider' => ['nullable', 'string', 'max:100'],
            'insurance_policy_number' => ['nullable', 'string', 'max:100'],
            'insurance_type' => ['nullable', 'string', 'in:all_risk,tlo,comprehensive'],
            'insurance_expires_at' => ['nullable', 'date'],
            'kir_expires_at' => ['nullable', 'date'],
            'photo_url' => ['nullable', 'string', 'max:2048'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ];
    }

    protected function prepareForValidation(): void
    {
        if ($this->exists('home_base_id')) {
            $this->merge([
                'home_base_id' => $this->filled('home_base_id') ? $this->input('home_base_id') : null,
            ]);
        }

        if ($this->exists('rental_class')) {
            $this->merge([
                'rental_class' => $this->filled('rental_class') ? $this->input('rental_class') : null,
            ]);
        }

        if ($this->exists('partner_id')) {
            $this->merge([
                'partner_id' => $this->filled('partner_id') ? $this->input('partner_id') : null,
            ]);
        }

        if ($this->exists('contract_number')) {
            $this->merge([
                'contract_number' => $this->filled('contract_number') ? $this->input('contract_number') : null,
            ]);
        }

        if ($this->exists('contract_start_date')) {
            $this->merge([
                'contract_start_date' => $this->filled('contract_start_date') ? $this->input('contract_start_date') : null,
            ]);
        }

        if ($this->exists('contract_end_date')) {
            $this->merge([
                'contract_end_date' => $this->filled('contract_end_date') ? $this->input('contract_end_date') : null,
            ]);
        }

        if ($this->exists('settlement_scheme')) {
            $this->merge([
                'settlement_scheme' => $this->filled('settlement_scheme') ? $this->input('settlement_scheme') : null,
            ]);
        }

        if ($this->exists('revenue_share_owner_pct')) {
            $this->merge([
                'revenue_share_owner_pct' => $this->filled('revenue_share_owner_pct') ? $this->input('revenue_share_owner_pct') : null,
            ]);
        }

        if ($this->exists('revenue_share_tenant_pct')) {
            $this->merge([
                'revenue_share_tenant_pct' => $this->filled('revenue_share_tenant_pct') ? $this->input('revenue_share_tenant_pct') : null,
            ]);
        }

        if ($this->exists('fixed_fee_amount')) {
            $this->merge([
                'fixed_fee_amount' => $this->filled('fixed_fee_amount') ? $this->input('fixed_fee_amount') : null,
            ]);
        }

        if ($this->exists('maintenance_payer')) {
            $this->merge([
                'maintenance_payer' => $this->filled('maintenance_payer') ? $this->input('maintenance_payer') : 'tenant',
            ]);
        }
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'plate_number.required' => 'The plate number is required.',
            'plate_number.unique' => 'This plate number is already registered.',
            'type.in' => 'Select a valid vehicle type.',
            'fuel_type.in' => 'Select a valid fuel type.',
            'status.in' => 'Select a valid vehicle status.',
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator): void {
            AccessibleFleetBases::rejectIfDenied($validator, $this->input('home_base_id'));

            if ($this->has('status')) {
                $vehicleParam = $this->route('vehicle');
                $vehicle = $vehicleParam instanceof Vehicle
                    ? $vehicleParam
                    : Vehicle::query()->find($vehicleParam);

                if ($vehicle !== null
                    && $this->input('status') !== Vehicle::STATUS_MAINTENANCE
                    && WorkOrderShopHold::hasInProgress((int) $vehicle->id)) {
                    $validator->errors()->add('status', __('fleet.messages.vehicle_status_locked_by_work_order'));
                }
            }

            if ($this->has('status') && ! \App\Models\PlatformSetting::isPerVehicleTrialEnabled()) {
                $newStatus = $this->input('status');
                $isBecomingBillable = in_array($newStatus, \Modules\Fleet\Models\Vehicle::billableStatuses(), true);

                if ($isBecomingBillable) {
                    $vehicleParam = $this->route('vehicle');
                    $vehicle = $vehicleParam instanceof \Modules\Fleet\Models\Vehicle
                        ? $vehicleParam
                        : \Modules\Fleet\Models\Vehicle::find($vehicleParam);

                    $wasBillable = $vehicle?->isBillable() ?? false;

                    if (! $wasBillable) {
                        $tenant = tenant();
                        if ($tenant instanceof \App\Models\Tenant && $tenant->hasReachedLimit('max_vehicles', \Modules\Fleet\Models\Vehicle::billable()->count())) {
                            $limit = (int) $tenant->planLimit('max_vehicles');
                            $validator->errors()->add('status', __('fleet.messages.limit_reached_vehicles', ['limit' => $limit]));
                        }
                    }
                }
            }
        });
    }
}
