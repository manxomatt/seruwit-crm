<?php

namespace Modules\Inventory\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreStockOpnameRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'warehouse_id' => 'required|exists:warehouses,id',
            'opname_date' => 'required|date',
        ];
    }

    public function authorize(): bool
    {
        return $this->user()?->can('inventory:create') ?? false;
    }
}
