<?php

namespace Modules\Sales\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;
use Modules\Inventory\Models\WarehouseLocation;
use Modules\Sales\Models\GoodsIssueNote;
use Modules\Sales\Models\GoodsIssueNoteItem;
use Modules\Sales\Support\SalesReturnQuantity;

class StoreSalesReturnRequest extends FormRequest
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
            'items.*.gin_item_id' => ['required', 'integer', 'exists:goods_issue_note_items,id'],
            'items.*.so_item_id' => ['required', 'integer', 'exists:sales_order_items,id'],
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
            /** @var GoodsIssueNote $gin */
            $gin = $this->route('gin');

            foreach ($this->input('items', []) as $index => $item) {
                $ginItemId = (int) ($item['gin_item_id'] ?? 0);
                $qty = (float) ($item['quantity_returned'] ?? 0);

                $ginItem = GoodsIssueNoteItem::query()
                    ->with('salesOrderItem')
                    ->whereKey($ginItemId)
                    ->where('goods_issue_note_id', $gin->id)
                    ->first();

                if (! $ginItem) {
                    $validator->errors()->add("items.{$index}.gin_item_id", __('sales.validation.gin_item_not_on_note'));

                    continue;
                }

                if ((int) ($item['so_item_id'] ?? 0) !== (int) $ginItem->so_item_id) {
                    $validator->errors()->add("items.{$index}.so_item_id", __('sales.validation.so_item_not_on_order'));

                    continue;
                }

                $remaining = min(
                    SalesReturnQuantity::remainingForGinItem((float) $ginItem->quantity_issued, $ginItem->id),
                    (float) ($ginItem->salesOrderItem?->quantity_delivered ?? 0)
                );

                if ($qty > $remaining) {
                    $validator->errors()->add(
                        "items.{$index}.quantity_returned",
                        __('sales.validation.quantity_exceeds_remaining', ['remaining' => $remaining])
                    );
                }

                $locationId = $item['location_id'] ?? null;
                if ($locationId) {
                    $belongs = WarehouseLocation::query()
                        ->whereKey($locationId)
                        ->where('warehouse_id', $gin->warehouse_id)
                        ->exists();

                    if (! $belongs) {
                        $validator->errors()->add(
                            "items.{$index}.location_id",
                            __('sales.validation.location_wrong_warehouse')
                        );
                    }
                }
            }
        });
    }
}
