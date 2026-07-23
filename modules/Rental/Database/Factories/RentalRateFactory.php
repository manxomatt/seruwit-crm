<?php

namespace Modules\Rental\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\Rental\Models\RentalRate;

/**
 * @extends Factory<RentalRate>
 */
class RentalRateFactory extends Factory
{
    protected $model = RentalRate::class;

    /** @return array<string, mixed> */
    public function definition(): array
    {
        $periodType = fake()->randomElement(['daily', 'weekly', 'monthly']);

        return [
            'vehicle_id' => null,
            'vehicle_type' => fake()->randomElement(['Sedan', 'SUV', 'MPV', 'Pick Up', null]),
            'name' => ucfirst($periodType).' Rate '.fake()->word(),
            'period_type' => $periodType,
            'rate_per_period' => fake()->randomFloat(2, 300000, 5000000),
            'km_limit_per_period' => fake()->optional()->randomElement([100, 200, 300, 500]),
            'excess_km_rate' => fake()->optional()->randomFloat(2, 3000, 10000),
            'deposit_amount' => fake()->randomFloat(2, 500000, 5000000),
            'is_active' => true,
            'notes' => null,
        ];
    }

    public function daily(): static
    {
        return $this->state(fn (array $a): array => ['period_type' => 'daily']);
    }

    public function inactive(): static
    {
        return $this->state(fn (array $a): array => ['is_active' => false]);
    }
}
