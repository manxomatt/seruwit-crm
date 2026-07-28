<?php

namespace Modules\Accounting\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Modules\Accounting\Models\PaymentMethodAccountMap;

class UpdatePaymentMethodMapsRequest extends FormRequest
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
            'maps' => ['required', 'array'],
            'maps.*.payment_method' => ['required', 'string', Rule::in(PaymentMethodAccountMap::METHODS)],
            'maps.*.company_bank_account_id' => ['required', 'integer', 'exists:company_bank_accounts,id'],
        ];
    }
}
