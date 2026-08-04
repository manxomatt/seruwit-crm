<?php

namespace Modules\Fleet\Http\Requests;

use App\Modules\Facades\Modules;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\Rule;
use Modules\Fleet\Models\FleetBase;
use Modules\Fleet\Support\FleetBaseKind;

class UpdateFleetBaseRequest extends FormRequest
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
        /** @var FleetBase $fleetBase */
        $fleetBase = $this->route('fleetBase');

        $rules = [
            'code' => [
                'sometimes',
                'required',
                'string',
                'max:32',
                'alpha_dash',
                Rule::unique('fleet_bases', 'code')->ignore($fleetBase),
            ],
            'name' => ['sometimes', 'required', 'string', 'max:120'],
            'kind' => ['sometimes', 'required', 'string', Rule::in(FleetBaseKind::values())],
            'status' => ['sometimes', 'required', 'string', 'in:active,inactive'],
            'address' => ['nullable', 'string', 'max:255'],
            'city' => ['nullable', 'string', 'max:100'],
            'province' => ['nullable', 'string', 'max:100'],
            'zip' => ['nullable', 'string', 'max:20'],
            'latitude' => ['nullable', 'numeric', 'between:-90,90'],
            'longitude' => ['nullable', 'numeric', 'between:-180,180'],
            'phone' => ['nullable', 'string', 'max:30'],
            'email' => ['nullable', 'email', 'max:120'],
            'opens_at' => ['nullable', 'date_format:H:i'],
            'closes_at' => ['nullable', 'date_format:H:i'],
            'timezone' => ['sometimes', 'required', 'timezone'],
            'vehicle_capacity' => ['nullable', 'integer', 'min:1', 'max:65535'],
            'allows_overnight' => ['sometimes', 'required', 'boolean'],
            'service_radius_km' => ['nullable', 'numeric', 'min:0', 'max:999999.99'],
            'manager_id' => ['sometimes', 'required', 'integer', 'exists:users,id'],
            'location_id' => ['nullable', 'integer'],
            'warehouse_id' => ['nullable', 'integer'],
            'notes' => ['nullable', 'string', 'max:2000'],
            'staff_ids' => ['nullable', 'array'],
            'staff_ids.*' => ['integer', 'exists:users,id'],
        ];

        if (Modules::available('partners') && Schema::hasTable('locations')) {
            $rules['location_id'][] = 'exists:locations,id';
        }

        if (Modules::available('inventory') && Schema::hasTable('warehouses')) {
            $rules['warehouse_id'][] = 'exists:warehouses,id';
        }

        return $rules;
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'code.unique' => __('fleet.validation.code_unique'),
            'kind.in' => __('fleet.validation.kind_invalid'),
            'status.in' => __('fleet.validation.status_invalid'),
            'manager_id.required' => __('fleet.validation.manager_required'),
            'closes_at.after' => __('fleet.validation.closes_after_opens'),
        ];
    }

    protected function prepareForValidation(): void
    {
        $merge = [
            'location_id' => $this->filled('location_id') ? $this->input('location_id') : null,
            'warehouse_id' => $this->filled('warehouse_id') ? $this->input('warehouse_id') : null,
            'opens_at' => $this->normalizeTime($this->input('opens_at')),
            'closes_at' => $this->normalizeTime($this->input('closes_at')),
        ];

        if ($this->has('allows_overnight')) {
            $merge['allows_overnight'] = $this->boolean('allows_overnight');
        }

        if (is_string($this->code)) {
            $merge['code'] = strtoupper(trim($this->code));
        }

        $this->merge($merge);
    }

    private function normalizeTime(mixed $value): ?string
    {
        if (! is_string($value) || trim($value) === '') {
            return null;
        }

        return strlen($value) === 8 ? substr($value, 0, 5) : $value;
    }
}
