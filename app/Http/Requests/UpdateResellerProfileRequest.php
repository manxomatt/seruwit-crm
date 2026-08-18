<?php

namespace App\Http\Requests;

use App\Models\ResellerProfile;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateResellerProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('manage-resellers') ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'company_name' => ['nullable', 'string', 'max:255'],
            'status' => ['required', Rule::in([
                ResellerProfile::STATUS_ACTIVE,
                ResellerProfile::STATUS_SUSPENDED,
                ResellerProfile::STATUS_TERMINATED,
            ])],
            'referral_code' => [
                'required', 'string', 'max:32', 'regex:/^[A-Z0-9-]+$/',
                Rule::unique('reseller_profiles', 'referral_code')->ignore(
                    ResellerProfile::query()
                        ->where('reseller_global_id', $this->route('reseller'))
                        ->value('id')
                ),
            ],
            'default_commission_type' => ['nullable', Rule::in(['percent', 'flat'])],
            'default_commission_value' => ['nullable', 'numeric', 'min:0'],
            'renewal_commission_value' => ['nullable', 'numeric', 'min:0'],
            'payout_bank_name' => ['nullable', 'string', 'max:100'],
            'payout_account_number' => ['nullable', 'string', 'max:50'],
            'payout_account_name' => ['nullable', 'string', 'max:255'],
            'tax_id' => ['nullable', 'string', 'max:30'],
            'minimum_payout' => ['nullable', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'referral_code.regex' => __('reseller.validation.referral_code_regex'),
            'referral_code.unique' => __('reseller.validation.referral_code_unique'),
        ];
    }

    /**
     * A percentage rate above 100 would hand the reseller more than the payment
     * itself; a flat rate is separately capped at the base when it is applied.
     */
    public function withValidator(\Illuminate\Validation\Validator $validator): void
    {
        $validator->after(function (\Illuminate\Validation\Validator $validator): void {
            if ($this->input('default_commission_type') !== 'percent') {
                return;
            }

            foreach (['default_commission_value', 'renewal_commission_value'] as $field) {
                if ((float) $this->input($field) > 100) {
                    $validator->errors()->add($field, __('reseller.validation.percent_max'));
                }
            }
        });
    }
}
