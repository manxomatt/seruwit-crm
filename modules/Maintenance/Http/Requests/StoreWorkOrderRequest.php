<?php

namespace Modules\Maintenance\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreWorkOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, array<int, mixed>|string>
     */
    public function rules(): array
    {
        return [
            'vehicle_id' => ['required', 'exists:vehicles,id'],
            'category_id' => ['required', 'exists:maintenance_categories,id'],
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:5000'],
            'status' => ['required', 'string', 'in:draft,pending,approved,in_progress,completed,cancelled'],
            'priority' => ['required', 'string', 'in:low,normal,high,urgent'],
            'type' => ['required', 'string', 'in:scheduled,corrective,preventive,emergency'],
            'service_location' => ['nullable', 'string', 'in:in_house,outsource'],
            'odometer_at_service' => ['nullable', 'integer', 'min:0'],
            'scheduled_date' => ['nullable', 'date'],
            'vendor_name' => ['nullable', 'string', 'max:255'],
            'vendor_partner_id' => ['nullable', 'integer', 'exists:partners,id'],
            'mechanic_name' => ['nullable', 'string', 'max:255'],
            'mechanic_user_id' => ['nullable', 'integer', 'exists:users,id'],
            'bay_id' => ['nullable', 'integer', 'exists:maintenance_bays,id'],
            'estimated_hours' => ['nullable', 'numeric', 'min:0'],
            'waiting_parts' => ['sometimes', 'boolean'],
            'estimated_cost' => ['nullable', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string', 'max:2000'],
            'items' => ['nullable', 'array'],
            'items.*.item_type' => ['required', 'string', 'in:part,labor,other'],
            'items.*.product_id' => ['nullable', 'integer'],
            'items.*.warehouse_id' => ['nullable', 'integer'],
            'items.*.name' => ['required', 'string', 'max:255'],
            'items.*.description' => ['nullable', 'string', 'max:1000'],
            'items.*.quantity' => ['required', 'numeric', 'min:0.01'],
            'items.*.unit' => ['nullable', 'string', 'max:30'],
            'items.*.unit_price' => ['required', 'numeric', 'min:0'],
            'items.*.total_price' => ['required', 'numeric', 'min:0'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'vehicle_id.required' => 'Pilih kendaraan.',
            'vehicle_id.exists' => 'Kendaraan tidak ditemukan.',
            'category_id.required' => 'Pilih kategori perawatan.',
            'title.required' => 'Judul pekerjaan wajib diisi.',
            'status.in' => 'Status tidak valid.',
            'priority.in' => 'Prioritas tidak valid.',
            'type.in' => 'Tipe tidak valid.',
        ];
    }
}
