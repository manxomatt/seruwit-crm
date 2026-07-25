<?php

namespace Modules\Purchasing\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdatePurchaseOrderRequest extends FormRequest
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
        return [
            'partner_id' => [
                'required',
                'integer',
                Rule::exists('partners', 'id')->where(fn ($query) => $query->where('supplier_rank', '>', 0)),
            ],
            'warehouse_id' => ['required', 'integer', 'exists:warehouses,id'],
            'ordered_at' => ['required', 'date'],
            'expected_at' => ['nullable', 'date', 'after_or_equal:ordered_at'],
            'notes' => ['nullable', 'string', 'max:2000'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'integer', 'exists:products,id'],
            'items.*.quantity_ordered' => ['required', 'numeric', 'min:0.01'],
            'items.*.unit_price' => ['required', 'numeric', 'min:0'],
            'items.*.unit' => ['nullable', 'string', 'max:30'],
            'items.*.product_packaging_id' => ['nullable', 'integer', 'exists:product_packagings,id'],
            'items.*.notes' => ['nullable', 'string', 'max:500'],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator): void {
            foreach ($this->input('items', []) as $index => $item) {
                $packagingId = $item['product_packaging_id'] ?? null;
                $productId = $item['product_id'] ?? null;

                if (! $packagingId || ! $productId) {
                    continue;
                }

                $belongs = \Modules\Product\Models\ProductPackaging::query()
                    ->whereKey($packagingId)
                    ->where('product_id', $productId)
                    ->exists();

                if (! $belongs) {
                    $validator->errors()->add(
                        "items.{$index}.product_packaging_id",
                        __('purchasing.validation.packaging_mismatch'),
                    );
                }
            }
        });
    }
}
