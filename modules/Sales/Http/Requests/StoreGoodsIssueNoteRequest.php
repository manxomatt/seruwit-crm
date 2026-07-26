<?php

namespace Modules\Sales\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;
use Modules\Inventory\Models\WarehouseLocation;
use Modules\Sales\Models\SalesOrder;
use Modules\Sales\Models\SalesOrderItem;

class StoreGoodsIssueNoteRequest extends FormRequest
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
            'issued_at' => ['required', 'date'],
            'delivery_note_number' => ['nullable', 'string', 'max:100'],
            'notes' => ['nullable', 'string', 'max:2000'],
            'confirm' => ['sometimes', 'boolean'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.so_item_id' => ['required', 'integer', 'exists:sales_order_items,id'],
            'items.*.quantity_issued' => ['required', 'numeric', 'min:0.01'],
            'items.*.location_id' => ['nullable', 'integer', 'exists:warehouse_locations,id'],
            'items.*.batch_number' => ['nullable', 'string', 'max:100'],
            'items.*.expiry_date' => ['nullable', 'date', 'after:today'],
            'items.*.notes' => ['nullable', 'string', 'max:500'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            \Modules\Inventory\Support\WarehouseKindGuard::rejectIfCannotSell(
                $validator,
                $this->input('warehouse_id'),
            );
            \Modules\Inventory\Support\WarehouseKindGuard::rejectIfInaccessible(
                $validator,
                $this->input('warehouse_id'),
            );

            /** @var SalesOrder $so */
            $so = $this->route('so');
            $warehouseId = (int) $this->input('warehouse_id');

            foreach ($this->input('items', []) as $index => $item) {
                $soItemId = (int) ($item['so_item_id'] ?? 0);
                $qty = (float) ($item['quantity_issued'] ?? 0);

                $soItem = SalesOrderItem::query()
                    ->whereKey($soItemId)
                    ->where('sales_order_id', $so->id)
                    ->first();

                if (! $soItem) {
                    $validator->errors()->add("items.{$index}.so_item_id", __('sales.validation.so_item_not_on_order'));

                    continue;
                }

                $remaining = $soItem->remainingQuantity();
                if ($qty > $remaining) {
                    $validator->errors()->add(
                        "items.{$index}.quantity_issued",
                        __('sales.validation.quantity_exceeds_remaining', ['remaining' => $remaining])
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
                            __('sales.validation.location_wrong_warehouse')
                        );
                    }
                }
            }
        });
    }
}
