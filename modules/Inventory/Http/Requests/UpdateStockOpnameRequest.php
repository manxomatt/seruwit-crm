<?php

namespace Modules\Inventory\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateStockOpnameRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'opname_date' => 'sometimes|date',
            'status' => 'sometimes|in:draft,in_progress,completed',
        ];
    }

    public function authorize(): bool
    {
        return $this->user()?->can('inventory:update') ?? false;
    }
}
