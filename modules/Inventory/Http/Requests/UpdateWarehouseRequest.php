<?php

namespace Modules\Inventory\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateWarehouseRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'name' => 'sometimes|string|max:255',
            'location' => 'sometimes|string|max:255',
            'status' => 'sometimes|in:active,inactive',
        ];
    }

    public function authorize(): bool
    {
        return $this->user()?->can('inventory:update') ?? false;
    }
}
