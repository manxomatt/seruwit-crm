<?php

namespace Modules\Payables\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\Rule;
use Modules\Payables\Models\BillPayment;

class StoreBillPaymentRequest extends FormRequest
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
        $rules = [
            'partner_id' => ['required', 'integer', 'exists:partners,id'],
            'payment_date' => ['required', 'date'],
            'amount' => ['required', 'numeric', 'min:0.01'],
            'method' => ['required', 'string', Rule::in(BillPayment::methods())],
            'reference_number' => ['nullable', 'string', 'max:100'],
            'notes' => ['nullable', 'string', 'max:1000'],
            'allocations' => ['required', 'array', 'min:1'],
            'allocations.*.supplier_bill_id' => ['required', 'integer', 'exists:supplier_bills,id'],
            'allocations.*.amount' => ['required', 'numeric', 'min:0.01'],
        ];

        if (Schema::hasTable('company_bank_accounts')) {
            $rules['company_bank_account_id'] = ['nullable', 'integer', 'exists:company_bank_accounts,id'];
        }

        return $rules;
    }
}
