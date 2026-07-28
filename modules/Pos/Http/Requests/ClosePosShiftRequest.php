<?php

namespace Modules\Pos\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class ClosePosShiftRequest extends FormRequest
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
            'closing_cash_counted' => ['required', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ];

        if (Schema::hasTable('company_bank_accounts')
            && Schema::hasColumn('pos_shifts', 'deposit_to_company_bank_account_id')) {
            $rules['deposit_to_company_bank_account_id'] = [
                'nullable',
                'integer',
                Rule::exists('company_bank_accounts', 'id')->where(fn ($q) => $q->where('is_active', true)),
            ];
            $rules['deposit_amount'] = ['nullable', 'numeric', 'min:0'];
        }

        return $rules;
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            if (! Schema::hasColumn('pos_shifts', 'deposit_to_company_bank_account_id')) {
                return;
            }

            $toId = $this->input('deposit_to_company_bank_account_id');
            if ($toId === null || $toId === '') {
                return;
            }

            $counted = round((float) $this->input('closing_cash_counted', 0), 2);
            $deposit = $this->filled('deposit_amount')
                ? round((float) $this->input('deposit_amount'), 2)
                : $counted;

            if ($deposit > $counted + 0.004) {
                $validator->errors()->add(
                    'deposit_amount',
                    __('pos.validation.deposit_exceeds_counted'),
                );
            }
        });
    }
}
