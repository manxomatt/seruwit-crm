<?php

namespace Modules\Accounting\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreFixedAssetRequest extends FormRequest
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
            'code' => ['required', 'string', 'max:32', 'unique:fixed_assets,code'],
            'name' => ['required', 'string', 'max:255'],
            'category' => ['nullable', 'string', 'max:64'],
            'acquisition_date' => ['required', 'date'],
            'acquisition_cost' => ['required', 'numeric', 'min:0.01'],
            'salvage_value' => ['nullable', 'numeric', 'min:0'],
            'useful_life_months' => ['required', 'integer', 'min:1', 'max:600'],
            'method' => ['nullable', 'string', 'in:straight_line'],
            'asset_account_id' => ['required', 'integer', 'exists:accounts,id'],
            'accum_depr_account_id' => ['required', 'integer', 'exists:accounts,id'],
            'expense_account_id' => ['required', 'integer', 'exists:accounts,id'],
            'funding_account_id' => ['nullable', 'integer', 'exists:accounts,id'],
            'post_acquisition' => ['sometimes', 'boolean'],
            'vehicle_id' => ['nullable', 'integer'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
