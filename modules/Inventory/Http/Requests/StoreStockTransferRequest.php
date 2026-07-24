<?php

namespace Modules\Inventory\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;
use Modules\Inventory\Models\WarehouseLocation;
use Modules\Inventory\Support\StockMovementRecorder;

class StoreStockTransferRequest extends FormRequest
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
            'product_id' => ['required', 'integer', 'exists:products,id'],
            'from_warehouse_id' => ['required', 'integer', 'exists:warehouses,id', 'different:to_warehouse_id'],
            'to_warehouse_id' => ['required', 'integer', 'exists:warehouses,id'],
            'from_location_id' => ['nullable', 'integer', 'exists:warehouse_locations,id'],
            'to_location_id' => ['nullable', 'integer', 'exists:warehouse_locations,id'],
            'quantity' => ['required', 'numeric', 'min:0.01'],
            'batch_number' => ['nullable', 'string', 'max:100'],
            'expiry_date' => ['nullable', 'date'],
            'reference_code' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'from_warehouse_id.different' => 'Source and destination warehouses must be different.',
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $fromWarehouseId = (int) $this->input('from_warehouse_id');
            $toWarehouseId = (int) $this->input('to_warehouse_id');
            $fromLocationId = $this->input('from_location_id');
            $toLocationId = $this->input('to_location_id');

            if ($fromLocationId) {
                $belongs = WarehouseLocation::query()
                    ->whereKey($fromLocationId)
                    ->where('warehouse_id', $fromWarehouseId)
                    ->exists();

                if (! $belongs) {
                    $validator->errors()->add('from_location_id', 'Location must belong to the source warehouse.');
                }
            }

            if ($toLocationId) {
                $belongs = WarehouseLocation::query()
                    ->whereKey($toLocationId)
                    ->where('warehouse_id', $toWarehouseId)
                    ->exists();

                if (! $belongs) {
                    $validator->errors()->add('to_location_id', 'Location must belong to the destination warehouse.');
                }
            }

            if ($validator->errors()->isNotEmpty()) {
                return;
            }

            $productId = (int) $this->input('product_id');
            $quantity = (float) $this->input('quantity');
            $batch = $this->input('batch_number');
            $available = (float) StockMovementRecorder::availableOnHand(
                $productId,
                $fromWarehouseId,
                $fromLocationId ? (int) $fromLocationId : null,
                filled($batch) ? (string) $batch : null,
            );

            if ($quantity > $available) {
                $validator->errors()->add(
                    'quantity',
                    "Insufficient stock at source. Available: {$available}."
                );
            }
        });
    }
}
