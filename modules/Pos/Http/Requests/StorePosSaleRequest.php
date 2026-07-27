<?php

namespace Modules\Pos\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Modules\Pos\Models\PosPayment;

class StorePosSaleRequest extends FormRequest
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
            'pos_shift_id' => ['required', 'integer', 'exists:pos_shifts,id'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'integer', 'exists:products,id'],
            'items.*.quantity' => ['required', 'numeric', 'gt:0'],
            'items.*.unit_price' => ['nullable', 'numeric', 'min:0'],
            'payment_method' => ['required', 'string', Rule::in([
                PosPayment::METHOD_CASH,
                PosPayment::METHOD_QRIS,
                PosPayment::METHOD_TRANSFER,
                PosPayment::METHOD_CARD,
                PosPayment::METHOD_OTHER,
            ])],
            'amount_tendered' => ['nullable', 'numeric', 'min:0'],
            'payment_reference' => ['nullable', 'string', 'max:255'],
            'partner_id' => ['nullable', 'integer'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'items.required' => __('pos.messages.cart_empty'),
            'items.min' => __('pos.messages.cart_empty'),
        ];
    }
}
