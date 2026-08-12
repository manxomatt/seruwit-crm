<?php

namespace Modules\Rental\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\Rental\Models\RentalRateTier;

/**
 * @extends Factory<RentalRateTier>
 */
class RentalRateTierFactory extends Factory
{
    protected $model = RentalRateTier::class;

    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'tier_type' => RentalRateTier::TIER_PERIOD_VOLUME,
            'min_threshold' => 1,
            'max_threshold' => null,
            'rate_per_period' => null,
            'discount_percent' => 10,
            'discount_flat' => null,
            'priority' => 0,
            'is_active' => true,
        ];
    }

    public function periodVolume(): static
    {
        return $this->state(fn (): array => ['tier_type' => RentalRateTier::TIER_PERIOD_VOLUME]);
    }

    public function loyalty(): static
    {
        return $this->state(fn (): array => ['tier_type' => RentalRateTier::TIER_LOYALTY_COUNT]);
    }

    public function fixed(int|float $amount): static
    {
        return $this->state(fn (): array => [
            'rate_per_period' => $amount,
            'discount_percent' => null,
            'discount_flat' => null,
        ]);
    }

    public function percent(int|float $pct): static
    {
        return $this->state(fn (): array => [
            'rate_per_period' => null,
            'discount_percent' => $pct,
            'discount_flat' => null,
        ]);
    }

    public function flat(int|float $amount): static
    {
        return $this->state(fn (): array => [
            'rate_per_period' => null,
            'discount_percent' => null,
            'discount_flat' => $amount,
        ]);
    }

    public function threshold(int $min, ?int $max = null): static
    {
        return $this->state(fn (): array => [
            'min_threshold' => $min,
            'max_threshold' => $max,
        ]);
    }
}
