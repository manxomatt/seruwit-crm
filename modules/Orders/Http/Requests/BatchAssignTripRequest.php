<?php

namespace Modules\Orders\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;
use Modules\Orders\Models\DeliveryOrder;
use Modules\TransportationManagement\Models\Trip;

class BatchAssignTripRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'trip_id' => ['required', 'integer', 'exists:trips,id'],
            'delivery_order_ids' => ['required', 'array', 'min:1'],
            'delivery_order_ids.*' => ['integer', 'exists:delivery_orders,id'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            if ($validator->errors()->isNotEmpty()) {
                return;
            }

            $trip = Trip::query()->find($this->input('trip_id'));

            if ($trip && $trip->status !== Trip::STATUS_SCHEDULED) {
                $validator->errors()->add('trip_id', __('orders.messages.assign_scheduled_only'));
            }

            $ids = collect($this->input('delivery_order_ids', []))->unique()->values();
            $orders = DeliveryOrder::query()->whereIn('id', $ids)->get(['id', 'code', 'status']);

            if ($orders->count() !== $ids->count()) {
                $validator->errors()->add('delivery_order_ids', __('orders.messages.batch_orders_missing'));

                return;
            }

            $invalid = $orders->first(
                fn (DeliveryOrder $order): bool => $order->status !== DeliveryOrder::STATUS_CONFIRMED
            );

            if ($invalid) {
                $validator->errors()->add(
                    'delivery_order_ids',
                    __('orders.messages.batch_orders_confirmed_only', ['code' => $invalid->code])
                );
            }
        });
    }
}
