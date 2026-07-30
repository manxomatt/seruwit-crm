<?php

namespace Modules\Shuttle\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Modules\Shuttle\Models\ShuttlePool;

class StoreShuttlePoolRequest extends FormRequest
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
        /** @var ShuttlePool|null $pool */
        $pool = $this->route('pool');

        return [
            'city_id' => ['required', 'exists:shuttle_cities,id'],
            'code' => [
                'required',
                'string',
                'max:50',
                Rule::unique('shuttle_pools', 'code')->ignore($pool),
            ],
            'name' => ['required', 'string', 'max:255'],
            'address' => ['nullable', 'string', 'max:500'],
            'latitude' => ['required', 'numeric', 'between:-90,90'],
            'longitude' => ['required', 'numeric', 'between:-180,180'],
            'is_origin' => ['sometimes', 'boolean'],
            'is_destination' => ['sometimes', 'boolean'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'code' => strtoupper(trim((string) $this->input('code'))),
            'is_origin' => filter_var($this->input('is_origin', true), FILTER_VALIDATE_BOOLEAN),
            'is_destination' => filter_var($this->input('is_destination', true), FILTER_VALIDATE_BOOLEAN),
            'is_active' => filter_var($this->input('is_active', true), FILTER_VALIDATE_BOOLEAN),
        ]);
    }
}
