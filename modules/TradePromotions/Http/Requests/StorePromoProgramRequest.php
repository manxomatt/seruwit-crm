<?php

namespace Modules\TradePromotions\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;
use Modules\TradePromotions\Models\TradePromoProgram;
use Modules\TradePromotions\Support\PromoProgramAuthorizer;

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
        $mode = $this->input('mode', TradePromoProgram::MODE_TRADE);
        $isCheckout = $mode === TradePromoProgram::MODE_CHECKOUT;

        return [
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:5000'],
            'mode' => ['required', Rule::in([
                TradePromoProgram::MODE_TRADE,
                TradePromoProgram::MODE_CHECKOUT,
            ])],
            'scope' => ['required', Rule::in([
                TradePromoProgram::SCOPE_GLOBAL,
                TradePromoProgram::SCOPE_SITES,
            ])],
            'channels' => [$isCheckout ? 'required' : 'nullable', 'array'],
            'channels.*' => ['string', Rule::in([
                TradePromoProgram::CHANNEL_POS,
                TradePromoProgram::CHANNEL_SALES,
                TradePromoProgram::CHANNEL_CANVASSING,
            ])],
            'warehouse_ids' => [
                Rule::requiredIf(fn () => $this->input('scope') === TradePromoProgram::SCOPE_SITES),
                'nullable',
                'array',
                'min:1',
            ],
            'warehouse_ids.*' => ['integer', 'exists:warehouses,id'],
            'type' => ['required', Rule::in($isCheckout
                ? [
                    TradePromoProgram::TYPE_CHECKOUT_DISCOUNT,
                    TradePromoProgram::TYPE_CHECKOUT_BOGO,
                    TradePromoProgram::TYPE_CHECKOUT_BUNDLE,
                ]
                : [
                    TradePromoProgram::TYPE_VOLUME_DISCOUNT,
                    TradePromoProgram::TYPE_FREE_GOODS,
                    TradePromoProgram::TYPE_REBATE,
                ])],
            'starts_at' => ['required', 'date'],
            'ends_at' => ['required', 'date', 'after:starts_at'],
            'principal_id' => ['nullable', 'integer', 'exists:principals,id'],
            'target_metric' => [$isCheckout ? 'nullable' : 'required', Rule::in([
                TradePromoProgram::METRIC_VOLUME,
                TradePromoProgram::METRIC_VALUE,
            ])],
            'target_amount' => ['nullable', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string', 'max:2000'],
            'partner_ids' => ['nullable', 'array'],
            'partner_ids.*' => ['integer', 'exists:partners,id'],
            'product_ids' => [$isCheckout ? 'required' : 'nullable', 'array', $isCheckout ? 'min:1' : 'nullable'],
            'product_ids.*' => ['integer', 'exists:products,id'],
            'tiers' => [$isCheckout ? 'required' : 'nullable', 'array', $isCheckout ? 'min:1' : 'nullable'],
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

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $user = $this->user();
            $scope = (string) $this->input('scope', TradePromoProgram::SCOPE_GLOBAL);
            $warehouseIds = array_map('intval', $this->input('warehouse_ids', []) ?? []);

            PromoProgramAuthorizer::assertCanSetScope($validator, $user, $scope);

            if ($scope === TradePromoProgram::SCOPE_SITES) {
                PromoProgramAuthorizer::assertCanAssignWarehouses($validator, $user, $warehouseIds);
            }

            if ($this->input('mode') === TradePromoProgram::MODE_CHECKOUT) {
                $type = (string) $this->input('type');
                $tier = ($this->input('tiers')[0] ?? []);

                if ($type === TradePromoProgram::TYPE_CHECKOUT_BOGO) {
                    if (($tier['min_qty'] ?? null) === null || (float) $tier['min_qty'] <= 0) {
                        $validator->errors()->add('tiers', __('promotions.validation.checkout_bogo_required'));
                    }
                    if (($tier['free_qty'] ?? null) === null || (float) $tier['free_qty'] <= 0) {
                        $validator->errors()->add('tiers', __('promotions.validation.checkout_bogo_required'));
                    }
                } elseif (($tier['discount_percent'] ?? null) === null && ($tier['discount_amount'] ?? null) === null) {
                    $validator->errors()->add('tiers', __('promotions.validation.checkout_discount_required'));
                }

                if ($type === TradePromoProgram::TYPE_CHECKOUT_BUNDLE
                    && count($this->input('product_ids', []) ?? []) < 2) {
                    $validator->errors()->add('product_ids', __('promotions.validation.checkout_bundle_products'));
                }
            }
        });
    }
}
