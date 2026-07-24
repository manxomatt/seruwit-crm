<?php

namespace Modules\Purchasing\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;
use Modules\Inventory\Models\WarehouseLocation;
use Modules\Purchasing\Models\PurchaseOrder;
use Modules\Purchasing\Models\PurchaseOrderItem;

class StoreGoodReceiptNoteRequest extends FormRequest
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
            'warehouse_id' => ['required', 'integer', 'exists:warehouses,id'],
            'received_at' => ['required', 'date'],
            'supplier_do_number' => ['nullable', 'string', 'max:100'],
            'notes' => ['nullable', 'string', 'max:2000'],
            'confirm' => ['sometimes', 'boolean'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.po_item_id' => ['required', 'integer', 'exists:purchase_order_items,id'],
            'items.*.quantity_received' => ['required', 'numeric', 'min:0.01'],
            'items.*.location_id' => ['nullable', 'integer', 'exists:warehouse_locations,id'],
            'items.*.batch_number' => ['nullable', 'string', 'max:100'],
            'items.*.expiry_date' => ['nullable', 'date', 'after:today'],
            'items.*.notes' => ['nullable', 'string', 'max:500'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            /** @var PurchaseOrder $po */
            $po = $this->route('po');
            $warehouseId = (int) $this->input('warehouse_id');

            foreach ($this->input('items', []) as $index => $item) {
                $poItemId = (int) ($item['po_item_id'] ?? 0);
                $qty = (float) ($item['quantity_received'] ?? 0);

                $poItem = PurchaseOrderItem::query()
                    ->whereKey($poItemId)
                    ->where('purchase_order_id', $po->id)
                    ->first();

                if (! $poItem) {
                    $validator->errors()->add("items.{$index}.po_item_id", 'Item does not belong to this purchase order.');

                    continue;
                }

                $remaining = $poItem->remainingQuantity();
                if ($qty > $remaining) {
                    $validator->errors()->add(
                        "items.{$index}.quantity_received",
                        "Quantity exceeds remaining ({$remaining})."
                    );
                }

                $locationId = $item['location_id'] ?? null;
                if ($locationId) {
                    $belongs = WarehouseLocation::query()
                        ->whereKey($locationId)
                        ->where('warehouse_id', $warehouseId)
                        ->exists();

                    if (! $belongs) {
                        $validator->errors()->add(
                            "items.{$index}.location_id",
                            'Location must belong to the selected warehouse.'
                        );
                    }
                }
            }
        });
    }
}
