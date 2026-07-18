<?php

namespace Modules\Billing\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\Billing\Models\TripAllowance;
use Modules\TransportationManagement\Models\Trip;

/**
 * @extends Factory<TripAllowance>
 */
class TripAllowanceFactory extends Factory
{
    /**
     * Factory::modelName() infers App\Models from the factory's own name, so a
     * module factory has to state its model outright.
     *
     * @var class-string<TripAllowance>
     */
    protected $model = TripAllowance::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'trip_id' => Trip::factory(),
            'advance_amount' => fake()->randomFloat(2, 200000, 2000000),
            'status' => TripAllowance::STATUS_ISSUED,
            'issued_at' => now(),
            'settled_at' => null,
            'notes' => fake()->optional()->sentence(),
        ];
    }

    /**
     * Indicate that the allowance has been settled.
     */
    public function settled(): static
    {
        return $this->state(fn (array $attributes): array => [
            'status' => TripAllowance::STATUS_SETTLED,
            'settled_at' => now(),
        ]);
    }
}
