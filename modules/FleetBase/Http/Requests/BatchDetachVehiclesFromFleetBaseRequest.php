<?php

namespace Modules\FleetBase\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class BatchDetachVehiclesFromFleetBaseRequest extends FormRequest
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
            'vehicle_ids' => ['required', 'array', 'min:1'],
            'vehicle_ids.*' => ['required', 'integer', 'distinct', 'exists:vehicles,id'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'vehicle_ids.required' => 'Pilih setidaknya satu kendaraan untuk dilepas.',
            'vehicle_ids.min' => 'Pilih setidaknya satu kendaraan untuk dilepas.',
            'vehicle_ids.*.exists' => 'Kendaraan yang dipilih tidak valid.',
        ];
    }
}
