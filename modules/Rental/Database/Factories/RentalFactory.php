<?php

namespace Modules\Rental\Database\Factories;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\Fleet\Models\Vehicle;
use Modules\Partners\Models\Partner;
use Modules\Rental\Models\Rental;

/**
 * @extends Factory<Rental>
 */
class RentalFactory extends Factory
{
    protected $model = Rental::class;

    /** @return array<string, mixed> */
    public function definition(): array
    {
        $start = Carbon::parse(fake()->dateTimeBetween('-1 month', '+1 month'))->toDateString();
        $days = fake()->numberBetween(1, 14);
        $end = Carbon::parse($start)->addDays($days - 1)->toDateString();
        $rate = fake()->randomFloat(2, 300000, 1500000);

        return [
            'code' => Rental::nextCode(),
            'vehicle_id' => Vehicle::factory(),
            'driver_id' => null,
            'partner_id' => Partner::factory(),
            'status' => Rental::STATUS_DRAFT,
            'start_date' => $start,
            'end_date' => $end,
            'actual_return_date' => null,
            'period_type' => 'daily',
            'rate_per_period' => $rate,
            'km_limit_per_period' => null,
            'excess_km_rate' => null,
            'deposit_amount' => $rate,
            'total_periods' => $days,
            'base_amount' => $rate * $days,
            'start_odometer' => null,
            'end_odometer' => null,
            'excess_km' => null,
            'excess_amount' => 0,
            'deposit_returned' => false,
            'total_amount' => $rate * $days,
            'notes' => null,
            'cancelled_reason' => null,
            'confirmed_by' => null,
            'confirmed_at' => null,
            'checked_out_at' => null,
            'returned_at' => null,
            'completed_at' => null,
        ];
    }

    public function confirmed(): static
    {
        return $this->state(fn (array $a): array => [
            'status' => Rental::STATUS_CONFIRMED,
            'confirmed_at' => now(),
        ]);
    }

    public function active(): static
    {
        return $this->state(fn (array $a): array => [
            'status' => Rental::STATUS_ACTIVE,
            'confirmed_at' => now()->subDay(),
            'checked_out_at' => now(),
            'start_odometer' => fake()->numberBetween(10000, 100000),
        ]);
    }

    public function returned(): static
    {
        return $this->state(fn (array $a): array => [
            'status' => Rental::STATUS_RETURNED,
            'confirmed_at' => now()->subDays(3),
            'checked_out_at' => now()->subDays(2),
            'returned_at' => now(),
            'start_odometer' => 50000,
            'end_odometer' => 50200,
            'excess_km' => 0,
        ]);
    }

    public function completed(): static
    {
        return $this->state(fn (array $a): array => [
            'status' => Rental::STATUS_COMPLETED,
            'confirmed_at' => now()->subDays(5),
            'checked_out_at' => now()->subDays(4),
            'returned_at' => now()->subDay(),
            'completed_at' => now(),
        ]);
    }

    public function cancelled(): static
    {
        return $this->state(fn (array $a): array => [
            'status' => Rental::STATUS_CANCELLED,
            'cancelled_reason' => fake()->sentence(),
        ]);
    }
}
