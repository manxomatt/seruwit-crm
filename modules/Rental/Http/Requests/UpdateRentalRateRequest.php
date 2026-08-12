<?php

namespace Modules\Rental\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Modules\Fleet\Support\VehicleRentalClass;
use Modules\Rental\Models\RentalRateTier;

class UpdateRentalRateRequest extends FormRequest
{
    public function rules(): array
    {
        $tierTypes = implode(',', [RentalRateTier::TIER_PERIOD_VOLUME, RentalRateTier::TIER_LOYALTY_COUNT]);

        return [
            'vehicle_id' => ['nullable', 'exists:vehicles,id'],
            'vehicle_type' => ['nullable', 'string', 'max:100'],
            'rental_class' => ['nullable', 'string', Rule::in(VehicleRentalClass::values())],
            'name' => ['required', 'string', 'max:191'],
            'period_type' => ['required', 'in:daily,weekly,monthly'],
            'rate_per_period' => ['required', 'numeric', 'min:0'],
            'km_limit_per_period' => ['nullable', 'integer', 'min:0'],
            'excess_km_rate' => ['nullable', 'numeric', 'min:0'],
            'late_fee_per_day' => ['nullable', 'numeric', 'min:0'],
            'deposit_amount' => ['nullable', 'numeric', 'min:0'],
            'is_active' => ['boolean'],
            'valid_from' => ['nullable', 'date'],
            'valid_to' => ['nullable', 'date', 'after_or_equal:valid_from'],
            'min_periods' => ['nullable', 'integer', 'min:1'],
            'priority' => ['nullable', 'integer', 'min:0', 'max:999'],
            'notes' => ['nullable', 'string'],
            'tiers' => ['nullable', 'array'],
            'tiers.*.id' => ['nullable', 'integer', 'exists:rental_rate_tiers,id'],
            'tiers.*.tier_type' => ['required', 'in:'.$tierTypes],
            'tiers.*.min_threshold' => ['required', 'integer', 'min:0'],
            'tiers.*.max_threshold' => ['nullable', 'integer', 'min:0', 'gte:tiers.*.min_threshold'],
            'tiers.*.rate_per_period' => ['nullable', 'numeric', 'min:0'],
            'tiers.*.discount_percent' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'tiers.*.discount_flat' => ['nullable', 'numeric', 'min:0'],
            'tiers.*.priority' => ['nullable', 'integer', 'min:0', 'max:999'],
            'tiers.*.is_active' => ['nullable', 'boolean'],
            'tiers_to_delete' => ['nullable', 'array'],
            'tiers_to_delete.*' => ['integer', 'exists:rental_rate_tiers,id'],
        ];
    }

    public function after(): array
    {
        return [
            function (): void {
                /** @var array<int, array<string, mixed>>|null $tiers */
                $tiers = $this->validated('tiers');
                if ($tiers === null) {
                    return;
                }

                foreach ($tiers as $idx => $tier) {
                    $hasModifier = filled($tier['rate_per_period'] ?? null)
                        || filled($tier['discount_percent'] ?? null)
                        || filled($tier['discount_flat'] ?? null);

                    if (! $hasModifier) {
                        $validator = $this->validator;
                        $validator->errors()->add(
                            "tiers.$idx.modifier",
                            'Setidaknya satu modifier (fixed rate / percent / flat) harus diisi.',
                        );
                    }
                }
            },
        ];
    }
}
