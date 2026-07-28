<?php

namespace Modules\Rental\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ReceiveRentalDepositRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'payment_method' => ['nullable', 'string', Rule::in(['cash', 'transfer', 'giro', 'card', 'other'])],
            'company_bank_account_id' => ['nullable', 'integer', 'min:1'],
        ];
    }
}
