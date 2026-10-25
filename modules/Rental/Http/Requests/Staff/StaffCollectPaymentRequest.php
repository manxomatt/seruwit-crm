<?php

declare(strict_types=1);

namespace Modules\Rental\Http\Requests\Staff;

use Illuminate\Foundation\Http\FormRequest;

class StaffCollectPaymentRequest extends FormRequest
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
            'payment_type' => ['required', 'string', 'in:full,deposit,installment'],
            'payment_method' => ['required', 'string', 'in:cash,edc,qris,transfer'],
            'amount' => ['required', 'numeric', 'min:0.01'],
            'company_bank_account_id' => ['nullable', 'integer'],
            'reference_number' => ['nullable', 'string', 'max:100'],
            'notes' => ['nullable', 'string', 'max:500'],
        ];
    }
}
