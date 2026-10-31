<?php

namespace Modules\Expenses\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Modules\Expenses\Models\ExpenseClaim;

class StoreExpenseClaimRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'type' => $this->input('type') ?: ExpenseClaim::TYPE_DIRECT,
            'title' => $this->input('title') ?: $this->input('description'),
            'reference_number' => $this->input('reference_number') ?: $this->input('reference'),
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'expense_date' => ['required', 'date'],
            'type' => ['required', 'string', Rule::in(ExpenseClaim::TYPES)],
            'title' => ['required', 'string', 'max:255'],
            'company_bank_account_id' => ['nullable', 'integer', 'exists:company_bank_accounts,id'],
            'partner_id' => ['nullable', 'integer', 'exists:partners,id'],
            'vehicle_id' => ['nullable', 'integer'],
            'driver_id' => ['nullable', 'integer'],
            'payment_method' => ['required', 'string', 'max:32'],
            'reference_number' => ['nullable', 'string', 'max:100'],
            'notes' => ['nullable', 'string', 'max:2000'],
            'post_immediately' => ['nullable', 'boolean'],
            'lines' => ['required', 'array', 'min:1'],
            'lines.*.expense_category_id' => ['nullable', 'integer', 'exists:expense_categories,id'],
            'lines.*.account_id' => ['nullable', 'integer', 'exists:accounts,id'],
            'lines.*.vehicle_id' => ['nullable', 'integer'],
            'lines.*.description' => ['required', 'string', 'max:255'],
            'lines.*.amount' => ['required', 'numeric', 'gt:0'],
            'lines.*.receipt_number' => ['nullable', 'string', 'max:100'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'expense_date.required' => 'Tanggal pengeluaran wajib diisi.',
            'title.required' => 'Judul / keperluan pengeluaran wajib diisi.',
            'lines.required' => 'Minimal satu baris rincian biaya wajib diisi.',
            'lines.*.description.required' => 'Deskripsi baris pengeluaran wajib diisi.',
            'lines.*.amount.gt' => 'Nominal baris pengeluaran harus lebih besar dari 0.',
        ];
    }
}
