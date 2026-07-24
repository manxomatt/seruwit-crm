<?php

namespace Modules\Routing\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateRoutePlanRouteRequest extends FormRequest
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
            'vehicle_id' => ['nullable', 'integer', 'exists:vehicles,id'],
            'driver_id' => ['nullable', 'integer', 'exists:drivers,id'],
        ];
    }
}
