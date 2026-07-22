<?php

namespace Modules\Inventory\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreWarehouseLocationRequest extends FormRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $warehouseId = $this->route('warehouse')?->id;

        return [
            'name' => 'required|string|max:255',
            'code' => "required|string|max:50|unique:warehouse_locations,code,NULL,id,warehouse_id,{$warehouseId}",
            'type' => 'required|in:view,internal,input,output,quality_control,transit,production,scrap',
            'parent_id' => 'nullable|integer|exists:warehouse_locations,id',
            'sort_order' => 'nullable|integer',
        ];
    }

    public function authorize(): bool
    {
        return true;
    }
}
