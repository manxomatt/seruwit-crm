<?php

namespace Modules\Rental\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Modules\Rental\Models\Rental;

class PayRentalInvoicesRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'payment_date' => ['required', 'date'],
            'amount' => ['required', 'numeric', 'min:0.01'],
            'type' => ['nullable', 'string', Rule::in(['down_payment', 'installment', 'settlement', 'other'])],
            'method' => ['nullable', 'string', Rule::in(['cash', 'transfer', 'giro', 'card', 'other'])],
            'company_bank_account_id' => ['nullable', 'integer', 'min:1'],
            'reference_number' => ['nullable', 'string', 'max:100'],
            'notes' => ['nullable', 'string', 'max:2000'],
            'allocations' => ['required', 'array', 'min:1'],
            'allocations.*.invoice_id' => ['required', 'integer', 'exists:invoices,id'],
            'allocations.*.amount' => ['required', 'numeric', 'min:0.01'],
        ];
    }

    public function withValidator(\Illuminate\Validation\Validator $validator): void
    {
        $validator->after(function (\Illuminate\Validation\Validator $validator): void {
            /** @var Rental|null $rental */
            $rental = $this->route('rental');

            if (! $rental) {
                return;
            }

            $amount = round((float) $this->input('amount', 0), 2);
            $allocations = collect($this->input('allocations', []));
            $allocatedTotal = round($allocations->sum(fn (array $row): float => (float) $row['amount']), 2);

            if (abs($allocatedTotal - $amount) > 0.009) {
                $validator->errors()->add(
                    'amount',
                    __('rental.validation.payment_amount_mismatch', ['allocated' => number_format($allocatedTotal, 2, '.', '')]),
                );
            }

            $invoiceIds = $allocations->pluck('invoice_id')->filter()->unique()->all();
            if (count($invoiceIds) !== $allocations->count()) {
                $validator->errors()->add('allocations', __('rental.validation.payment_allocations_invalid'));
            }
        });
    }
}
