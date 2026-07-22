<?php

namespace Modules\Product\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateProductRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'brand_id' => ['nullable', 'integer', 'exists:brands,id'],
            'product_type_id' => ['nullable', 'integer', 'exists:product_types,id'],
            'sku' => ['nullable', 'string', 'max:100', 'unique:products,sku,'.$this->route('product')->id],
            'barcode' => ['nullable', 'string', 'max:100'],
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'unit' => ['sometimes', 'required', 'string', 'max:20'],
            'description' => ['nullable', 'string', 'max:2000'],
            'price' => ['nullable', 'numeric', 'min:0'],
            'status' => ['sometimes', 'required', 'string', 'in:active,inactive'],
            'category' => ['sometimes', 'nullable', 'string', 'in:merchandise,fleet_sparepart'],
            'reorder_threshold' => ['sometimes', 'nullable', 'integer', 'min:0'],
            'reorder_quantity' => ['sometimes', 'nullable', 'integer', 'min:0'],
        ];
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'status.in' => 'Select a valid product status.',
            'category.in' => 'Select a valid inventory category.',
        ];
    }
}
