<?php

namespace Modules\Invoicing\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateInvoicingSettingsRequest extends FormRequest
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
            'default_payment_term_days' => ['required', 'integer', 'min:0', 'max:3650'],
        ];
    }
}
