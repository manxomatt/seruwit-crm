<?php

declare(strict_types=1);

namespace Modules\Rental\Http\Requests\Staff;

use Illuminate\Foundation\Http\FormRequest;

class StaffStoreWalkInCustomerRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, list<string>>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'phone' => ['required', 'string', 'max:30'],
            'email' => ['nullable', 'email', 'max:255'],
            'id_number' => ['nullable', 'string', 'max:50'],
            'driver_license_number' => ['nullable', 'string', 'max:50'],
            'address' => ['nullable', 'string', 'max:500'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'name.required' => __('rental.validation.walk_in_name_required', ['default' => 'Nama pelanggan wajib diisi.']),
            'phone.required' => __('rental.validation.walk_in_phone_required', ['default' => 'Nomor HP/WhatsApp wajib diisi.']),
        ];
    }
}
