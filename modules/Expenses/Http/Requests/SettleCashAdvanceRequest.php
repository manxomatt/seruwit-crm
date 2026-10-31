<?php

namespace Modules\Expenses\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SettleCashAdvanceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'settlement_date' => $this->input('settlement_date') ?: $this->input('settled_date') ?: now()->toDateString(),
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'settlement_date' => ['required', 'date'],
            'payment_method' => ['nullable', 'string', 'max:32'],
            'company_bank_account_id' => ['nullable', 'integer', 'exists:company_bank_accounts,id'],
            'notes' => ['nullable', 'string', 'max:2000'],
            'lines' => ['required', 'array', 'min:1'],
            'lines.*.expense_category_id' => ['nullable', 'integer', 'exists:expense_categories,id'],
            'lines.*.account_id' => ['nullable', 'integer', 'exists:accounts,id'],
            'lines.*.vehicle_id' => ['nullable', 'integer'],
            'lines.*.description' => ['required', 'string', 'max:255'],
            'lines.*.amount' => ['required', 'numeric', 'min:0'],
            'lines.*.receipt_number' => ['nullable', 'string', 'max:100'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'settlement_date.required' => 'Tanggal pertanggungjawaban (LPJ) wajib diisi.',
            'lines.required' => 'Minimal satu baris realisasi pengeluaran wajib diisi.',
            'lines.*.description.required' => 'Deskripsi realisasi biaya wajib diisi.',
        ];
    }
}
