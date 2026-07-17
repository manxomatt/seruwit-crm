<?php

namespace Modules\TransportationManagement\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\Fleet\Models\Driver;
use Modules\Fleet\Models\Vehicle;
use Modules\TransportationManagement\Models\Trip;

/**
 * @extends Factory<Trip>
 */
class TripFactory extends Factory
{
    /**
     * Factory::modelName() infers App\Models from the factory's own name, so a
     * module factory has to state its model outright.
     *
     * @var class-string<Trip>
     */
    protected $model = Trip::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'code' => 'TRIP-'.fake()->unique()->numerify('######'),
            'vehicle_id' => Vehicle::factory(),
            'driver_id' => Driver::factory(),
            'origin' => fake()->city(),
            'destination' => fake()->city(),
            'cargo_notes' => fake()->optional()->sentence(),
            'scheduled_at' => fake()->dateTimeBetween('now', '+1 week'),
            'started_at' => null,
            'completed_at' => null,
            'distance_km' => fake()->optional()->randomFloat(2, 5, 500),
            'status' => Trip::STATUS_SCHEDULED,
            'cancelled_reason' => null,
        ];
    }

    /**
     * Indicate that the trip is currently under way.
     */
    public function inProgress(): static
    {
        return $this->state(fn (array $attributes): array => [
            'status' => Trip::STATUS_IN_PROGRESS,
            'started_at' => now(),
        ]);
    }

    /**
     * Indicate that the trip has been completed.
     */
    public function completed(): static
    {
        return $this->state(fn (array $attributes): array => [
            'status' => Trip::STATUS_COMPLETED,
            'started_at' => now()->subHours(2),
            'completed_at' => now(),
        ]);
    }

    /**
     * Indicate that the trip was cancelled.
     */
    public function cancelled(): static
    {
        return $this->state(fn (array $attributes): array => [
            'status' => Trip::STATUS_CANCELLED,
            'cancelled_reason' => fake()->sentence(),
        ]);
    }
}
