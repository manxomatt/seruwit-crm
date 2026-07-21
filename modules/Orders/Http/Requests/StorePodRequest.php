<?php

namespace Modules\Orders\Http\Requests;

use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Modules\Orders\Models\DeliveryOrder;

class StorePodRequest extends FormRequest
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
     * Signature and photos arrive as base64 data-URL strings — the driver's
     * canvas and camera never round-trip through a multipart upload, so the
     * whole POD posts as one JSON body.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'recipient_name' => ['required', 'string', 'max:255'],
            'signature' => ['nullable', 'string', 'starts_with:data:image/'],
            'notes' => ['nullable', 'string', 'max:2000'],
            'latitude' => ['nullable', 'numeric', 'between:-90,90'],
            'longitude' => ['nullable', 'numeric', 'between:-180,180'],

            'photos' => ['nullable', 'array', 'max:5'],
            'photos.*' => ['string', 'starts_with:data:image/'],

            'items' => ['required', 'array', 'min:1'],
            'items.*.delivery_order_item_id' => ['required', 'integer'],
            'items.*.accepted_quantity' => ['required', 'numeric', 'min:0'],
            'items.*.rejected_quantity' => ['required', 'numeric', 'min:0'],
            'items.*.returned_quantity' => ['required', 'numeric', 'min:0'],
            'items.*.reason' => ['nullable', 'string', 'max:500'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'recipient_name.required' => 'Nama penerima wajib diisi.',
            'items.required' => 'Detail barang wajib diisi.',
        ];
    }

    /**
     * Validates each POD line against the order it belongs to: the split of
     * accepted/rejected/returned may not exceed the quantity ordered, every
     * ordered line must be accounted for, and any shortfall needs a reason.
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            /** @var DeliveryOrder $order */
            $order = $this->route('order');

            $orderedByItem = $order->items()->pluck('quantity', 'id');
            $submittedIds = collect($this->input('items', []))->pluck('delivery_order_item_id')->map('intval');

            foreach ($orderedByItem->keys() as $orderedId) {
                if (! $submittedIds->contains((int) $orderedId)) {
                    $validator->errors()->add('items', 'Semua barang pada order harus dilaporkan.');

                    return;
                }
            }

            foreach ($this->input('items', []) as $index => $item) {
                $itemId = (int) ($item['delivery_order_item_id'] ?? 0);

                if (! $orderedByItem->has($itemId)) {
                    $validator->errors()->add("items.{$index}.delivery_order_item_id", 'Barang ini bukan bagian dari order.');

                    continue;
                }

                $accepted = (float) ($item['accepted_quantity'] ?? 0);
                $rejected = (float) ($item['rejected_quantity'] ?? 0);
                $returned = (float) ($item['returned_quantity'] ?? 0);
                $ordered = (float) $orderedByItem->get($itemId);

                if (($accepted + $rejected + $returned) > $ordered) {
                    $validator->errors()->add("items.{$index}.accepted_quantity", 'Total melebihi jumlah yang dipesan.');
                }

                if (($rejected + $returned) > 0 && trim((string) ($item['reason'] ?? '')) === '') {
                    $validator->errors()->add("items.{$index}.reason", 'Alasan wajib diisi untuk barang yang ditolak atau diretur.');
                }
            }
        });
    }
}
