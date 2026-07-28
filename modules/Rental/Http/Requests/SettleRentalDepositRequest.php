<?php

namespace Modules\Rental\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;
use Modules\Rental\Models\Rental;

class SettleRentalDepositRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'deposit_applied_amount' => ['required', 'numeric', 'min:0'],
            'deposit_refunded_amount' => ['required', 'numeric', 'min:0'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            /** @var Rental $rental */
            $rental = $this->route('rental');
            $deposit = round((float) $rental->deposit_amount, 2);
            $applied = round((float) $this->input('deposit_applied_amount', 0), 2);
            $refunded = round((float) $this->input('deposit_refunded_amount', 0), 2);

            if (abs(($applied + $refunded) - $deposit) > 0.009) {
                $validator->errors()->add(
                    'deposit_applied_amount',
                    __('rental.validation.deposit_settlement_sum', ['deposit' => number_format($deposit, 2, '.', '')]),
                );
            }
        });
    }
}
