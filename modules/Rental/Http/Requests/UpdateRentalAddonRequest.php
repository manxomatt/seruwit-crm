<?php

namespace Modules\Rental\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateRentalAddonRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, list<\Illuminate\Contracts\Validation\ValidationRule|string>>
     */
    public function rules(): array
    {
        $addonId = $this->route('addon')?->id ?? $this->input('id');

        return [
            'name' => ['required', 'string', 'max:255'],
            'category' => ['required', 'string', Rule::in(['accessory', 'service', 'protection', 'comfort', 'fuel'])],
            'description' => ['nullable', 'string', 'max:1000'],
            'icon' => ['nullable', 'string', 'max:64'],
            'price_type' => ['required', Rule::in(['daily', 'flat'])],
            'price' => ['required', 'numeric', 'min:0'],
            'max_quantity' => ['required', 'integer', 'min:1', 'max:20'],
            'is_active' => ['sometimes', 'boolean'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'name.required' => 'Nama add-on wajib diisi.',
            'category.required' => 'Kategori add-on wajib dipilih.',
            'price.required' => 'Tarif / harga add-on wajib diisi.',
            'price.min' => 'Tarif tidak boleh negatif.',
            'max_quantity.required' => 'Maksimal jumlah pesanan wajib diisi.',
        ];
    }
}
