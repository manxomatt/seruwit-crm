<?php

namespace Modules\Shuttle\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateCorridorRequest extends FormRequest
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
        $corridor = $this->route('corridor');

        return [
            'code' => ['required', 'string', 'max:50', Rule::unique('shuttle_corridors', 'code')->ignore($corridor)],
            'name' => ['required', 'string', 'max:255'],
            'origin_city' => ['required', 'string', 'max:100'],
            'destination_city' => ['required', 'string', 'max:100'],
            'origin_location_id' => ['nullable', 'exists:locations,id'],
            'destination_location_id' => ['nullable', 'exists:locations,id'],
            'base_fare' => ['required', 'numeric', 'min:0'],
            'estimated_duration_minutes' => ['nullable', 'integer', 'min:1'],
            'distance_km' => ['nullable', 'numeric', 'min:0'],
            'is_active' => ['sometimes', 'boolean'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ];
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'origin_location_id' => $this->origin_location_id ?: null,
            'destination_location_id' => $this->destination_location_id ?: null,
            'estimated_duration_minutes' => $this->estimated_duration_minutes ?: null,
            'distance_km' => $this->distance_km ?: null,
            'is_active' => filter_var($this->input('is_active', true), FILTER_VALIDATE_BOOLEAN),
        ]);
    }
}
