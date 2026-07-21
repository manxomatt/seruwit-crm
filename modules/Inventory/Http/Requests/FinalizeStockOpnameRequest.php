<?php

namespace Modules\Inventory\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class FinalizeStockOpnameRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'items' => 'required|array',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.system_qty' => 'required|numeric|min:0',
            'items.*.actual_qty' => 'required|numeric|min:0',
        ];
    }

    public function authorize(): bool
    {
        return $this->user()?->can('inventory:adjust') ?? false;
    }
}
