<?php

namespace Modules\Inventory\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateWarehouseLocationRequest extends FormRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $warehouseId = $this->route('warehouse')?->id;
        $locationId = $this->route('location')?->id;

        return [
            'name' => 'sometimes|string|max:255',
            'code' => "sometimes|string|max:50|unique:warehouse_locations,code,{$locationId},id,warehouse_id,{$warehouseId}",
            'type' => 'sometimes|in:view,internal,input,output,quality_control,transit,production,scrap',
            'parent_id' => 'nullable|integer|exists:warehouse_locations,id',
            'sort_order' => 'nullable|integer',
        ];
    }

    public function authorize(): bool
    {
        return true;
    }
}
