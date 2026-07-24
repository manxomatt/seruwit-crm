<?php

namespace Modules\TradePromotions\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Modules\TradePromotions\Models\TradePromoProgram;

class StorePromoProgramRequest extends FormRequest
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
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:5000'],
            'type' => ['required', Rule::in([
                TradePromoProgram::TYPE_VOLUME_DISCOUNT,
                TradePromoProgram::TYPE_FREE_GOODS,
                TradePromoProgram::TYPE_REBATE,
            ])],
            'starts_at' => ['required', 'date'],
            'ends_at' => ['required', 'date', 'after:starts_at'],
            'principal_id' => ['nullable', 'integer', 'exists:principals,id'],
            'target_metric' => ['required', Rule::in([
                TradePromoProgram::METRIC_VOLUME,
                TradePromoProgram::METRIC_VALUE,
            ])],
            'target_amount' => ['nullable', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string', 'max:2000'],
            'partner_ids' => ['nullable', 'array'],
            'partner_ids.*' => ['integer', 'exists:partners,id'],
            'product_ids' => ['nullable', 'array'],
            'product_ids.*' => ['integer', 'exists:products,id'],
            'tiers' => ['nullable', 'array'],
            'tiers.*.min_qty' => ['nullable', 'numeric', 'min:0'],
            'tiers.*.min_value' => ['nullable', 'numeric', 'min:0'],
            'tiers.*.discount_percent' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'tiers.*.discount_amount' => ['nullable', 'numeric', 'min:0'],
            'tiers.*.free_product_id' => ['nullable', 'integer', 'exists:products,id'],
            'tiers.*.free_qty' => ['nullable', 'numeric', 'min:0'],
            'rebate_percent' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'rebate_per_unit' => ['nullable', 'numeric', 'min:0'],
            'calc_basis' => ['nullable', 'string', Rule::in(['qty', 'net_value'])],
        ];
    }
}
