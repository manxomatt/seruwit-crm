<?php

namespace Modules\Expenses\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreCashAdvanceRequest extends FormRequest
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
            'advance_date' => ['required', 'date'],
            'purpose' => ['required', 'string', 'max:255'],
            'recipient_name' => ['nullable', 'string', 'max:150'],
            'driver_id' => ['nullable', 'integer'],
            'partner_id' => ['nullable', 'integer', 'exists:partners,id'],
            'vehicle_id' => ['nullable', 'integer'],
            'company_bank_account_id' => ['nullable', 'integer', 'exists:company_bank_accounts,id'],
            'advance_account_id' => ['nullable', 'integer', 'exists:accounts,id'],
            'payment_method' => ['required', 'string', 'max:32'],
            'amount' => ['required', 'numeric', 'gt:0'],
            'reference_number' => ['nullable', 'string', 'max:100'],
            'notes' => ['nullable', 'string', 'max:2000'],
            'disburse_immediately' => ['nullable', 'boolean'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'advance_date.required' => 'Tanggal pengajuan kasbon wajib diisi.',
            'purpose.required' => 'Keperluan kasbon / uang jalan wajib diisi.',
            'amount.required' => 'Nominal kasbon wajib diisi.',
            'amount.gt' => 'Nominal kasbon harus lebih besar dari 0.',
        ];
    }
}
