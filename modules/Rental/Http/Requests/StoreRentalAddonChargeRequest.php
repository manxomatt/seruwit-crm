<?php

namespace Modules\Rental\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Modules\Rental\Support\RentalAddonCatalog;

class StoreRentalAddonChargeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'addon_code' => ['required', 'string', Rule::in(RentalAddonCatalog::codes())],
            'amount' => ['required', 'numeric', 'min:0.01'],
            'description' => ['nullable', 'string', 'max:255'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'addon_code.required' => __('rental.validation.addon_code_required'),
            'addon_code.in' => __('rental.validation.addon_code_invalid'),
            'amount.required' => __('rental.validation.addon_amount_required'),
            'amount.min' => __('rental.validation.addon_amount_min'),
        ];
    }
}
