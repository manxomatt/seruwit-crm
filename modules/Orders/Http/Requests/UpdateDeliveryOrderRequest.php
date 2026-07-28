<?php

namespace Modules\Orders\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateDeliveryOrderRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Partial updates are common on draft orders, so address/location pairs are
     * optional here. Create-time completeness is enforced by StoreDeliveryOrderRequest.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'partner_id' => ['sometimes', 'required', 'integer', 'exists:partners,id'],
            'order_date' => ['sometimes', 'required', 'date'],
            'pickup_location_id' => ['sometimes', 'nullable', 'integer', 'exists:locations,id'],
            'delivery_location_id' => ['sometimes', 'nullable', 'integer', 'exists:locations,id', 'different:pickup_location_id'],
            'pickup_address' => ['sometimes', 'nullable', 'string', 'max:255'],
            'delivery_address' => ['sometimes', 'nullable', 'string', 'max:255'],
            'delivery_lat' => ['nullable', 'numeric', 'between:-90,90'],
            'delivery_lng' => ['nullable', 'numeric', 'between:-180,180'],
            'demand_kg' => ['nullable', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string', 'max:2000'],
            'discount_percent' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'promised_at' => ['nullable', 'date'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'partner_id.required' => 'Please select a customer.',
            'partner_id.exists' => 'The selected customer does not exist.',
            'delivery_location_id.different' => 'Pickup and delivery locations must differ.',
        ];
    }
}
