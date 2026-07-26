<?php

namespace Modules\Inventory\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Modules\Inventory\Support\WarehouseKind;

class UpdateWarehouseRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'name' => 'sometimes|string|max:255',
            'location' => 'sometimes|string|max:255',
            'kind' => ['sometimes', Rule::enum(WarehouseKind::class)],
            'latitude' => ['nullable', 'numeric', 'between:-90,90'],
            'longitude' => ['nullable', 'numeric', 'between:-180,180'],
            'status' => 'sometimes|in:active,inactive',
        ];
    }

    public function authorize(): bool
    {
        return true;
    }
}
