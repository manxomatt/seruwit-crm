<?php

namespace Modules\Partners\Http\Requests\Mobile;

use Illuminate\Foundation\Http\FormRequest;

class SubmitKycRequest extends FormRequest
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
            'id_number' => ['required', 'string', 'max:50'],
            'license_number' => ['required', 'string', 'max:50'],
            'license_expires_at' => ['required', 'date', 'after:today'],
            'id_card_photo' => ['required', 'image', 'mimes:jpeg,png,jpg,webp', 'max:5120'],
            'driver_license_photo' => ['required', 'image', 'mimes:jpeg,png,jpg,webp', 'max:5120'],
            'selfie_photo' => ['nullable', 'image', 'mimes:jpeg,png,jpg,webp', 'max:5120'],
            'emergency_contact_name' => ['nullable', 'string', 'max:255'],
            'emergency_contact_phone' => ['nullable', 'string', 'max:50'],
            'emergency_contact_relationship' => ['nullable', 'string', 'max:100'],
        ];
    }
}
