<?php

namespace Modules\Rental\Http\Requests\Mobile;

use Illuminate\Foundation\Http\FormRequest;

class UploadDepositProofRequest extends FormRequest
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
            'deposit_proof' => ['required', 'file', 'mimes:jpg,jpeg,png,webp,pdf', 'max:5120'],
            'company_bank_account_id' => ['nullable', 'integer', 'exists:company_bank_accounts,id'],
            'notes' => ['nullable', 'string', 'max:500'],
        ];
    }
}
