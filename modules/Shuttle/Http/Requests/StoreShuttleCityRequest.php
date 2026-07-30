<?php

namespace Modules\Shuttle\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Modules\Shuttle\Models\ShuttleCity;

class StoreShuttleCityRequest extends FormRequest
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
        /** @var ShuttleCity|null $city */
        $city = $this->route('city');

        return [
            'code' => [
                'required',
                'string',
                'max:50',
                Rule::unique('shuttle_cities', 'code')->ignore($city),
            ],
            'name' => ['required', 'string', 'max:100'],
            'province' => ['nullable', 'string', 'max:100'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'code' => strtoupper(trim((string) $this->input('code'))),
            'is_active' => filter_var($this->input('is_active', true), FILTER_VALIDATE_BOOLEAN),
        ]);
    }
}
