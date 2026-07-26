<?php

namespace Modules\Purchasing\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;
use Modules\Inventory\Models\WarehouseLocation;
use Modules\Purchasing\Models\GoodReceiptNote;
use Modules\Purchasing\Models\GoodReceiptNoteItem;
use Modules\Purchasing\Support\PurchaseReturnQuantity;

class StorePurchaseReturnRequest extends FormRequest
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
            'returned_at' => ['required', 'date'],
            'notes' => ['nullable', 'string', 'max:2000'],
            'confirm' => ['sometimes', 'boolean'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.grn_item_id' => ['required', 'integer', 'exists:good_receipt_note_items,id'],
            'items.*.po_item_id' => ['required', 'integer', 'exists:purchase_order_items,id'],
            'items.*.quantity_returned' => ['required', 'numeric', 'min:0.01'],
            'items.*.location_id' => ['nullable', 'integer', 'exists:warehouse_locations,id'],
            'items.*.batch_number' => ['nullable', 'string', 'max:100'],
            'items.*.expiry_date' => ['nullable', 'date'],
            'items.*.notes' => ['nullable', 'string', 'max:500'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            /** @var GoodReceiptNote $grn */
            $grn = $this->route('grn');

            foreach ($this->input('items', []) as $index => $item) {
                $grnItemId = (int) ($item['grn_item_id'] ?? 0);
                $qty = (float) ($item['quantity_returned'] ?? 0);

                $grnItem = GoodReceiptNoteItem::query()
                    ->with('purchaseOrderItem')
                    ->whereKey($grnItemId)
                    ->where('good_receipt_note_id', $grn->id)
                    ->first();

                if (! $grnItem) {
                    $validator->errors()->add("items.{$index}.grn_item_id", __('purchasing.validation.grn_item_not_on_note'));

                    continue;
                }

                if ((int) ($item['po_item_id'] ?? 0) !== (int) $grnItem->po_item_id) {
                    $validator->errors()->add("items.{$index}.po_item_id", __('purchasing.validation.po_item_not_on_order'));

                    continue;
                }

                $remaining = min(
                    PurchaseReturnQuantity::remainingForGrnItem((float) $grnItem->quantity_received, $grnItem->id),
                    (float) ($grnItem->purchaseOrderItem?->quantity_received ?? 0)
                );

                if ($qty > $remaining) {
                    $validator->errors()->add(
                        "items.{$index}.quantity_returned",
                        __('purchasing.validation.quantity_exceeds_remaining', ['remaining' => $remaining])
                    );
                }

                $locationId = $item['location_id'] ?? null;
                if ($locationId) {
                    $belongs = WarehouseLocation::query()
                        ->whereKey($locationId)
                        ->where('warehouse_id', $grn->warehouse_id)
                        ->exists();

                    if (! $belongs) {
                        $validator->errors()->add(
                            "items.{$index}.location_id",
                            __('purchasing.validation.location_wrong_warehouse')
                        );
                    }
                }
            }
        });
    }
}
