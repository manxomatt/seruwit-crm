<?php

namespace Modules\Accounting\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Modules\Accounting\Models\BankTransaction;

class StoreBankTransactionRequest extends FormRequest
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
        $type = (string) $this->input('type');

        return [
            'type' => ['required', 'string', Rule::in(BankTransaction::TYPES)],
            'company_bank_account_id' => ['required', 'integer', 'exists:company_bank_accounts,id'],
            'counterparty_account_id' => [
                Rule::requiredIf($type === BankTransaction::TYPE_TRANSFER),
                'nullable',
                'integer',
                'different:company_bank_account_id',
                'exists:company_bank_accounts,id',
            ],
            'transacted_on' => ['required', 'date'],
            'amount' => ['required', 'numeric', 'min:0.01'],
            'reference' => ['nullable', 'string', 'max:255'],
            'memo' => ['nullable', 'string', 'max:2000'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'company_bank_account_id.required' => __('accounting.validation.bank_account_required'),
            'counterparty_account_id.required' => __('accounting.validation.bank_transfer_accounts'),
            'counterparty_account_id.different' => __('accounting.validation.bank_transfer_accounts'),
            'amount.min' => __('accounting.validation.bank_amount_positive'),
        ];
    }
}
