<?php

namespace Modules\TransportationManagement\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\TransportationManagement\Models\Trip;
use Modules\TransportationManagement\Models\TripStop;

/**
 * @extends Factory<TripStop>
 */
class TripStopFactory extends Factory
{
    /**
     * Factory::modelName() infers App\Models from the factory's own name, so a
     * module factory has to state its model outright.
     *
     * @var class-string<TripStop>
     */
    protected $model = TripStop::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'trip_id' => Trip::factory(),
            'sequence' => 1,
            'type' => TripStop::TYPE_DROPOFF,
            'address' => fake()->address(),
            'lat' => null,
            'lng' => null,
            'delivery_order_id' => null,
            'status' => TripStop::STATUS_PENDING,
            'arrived_at' => null,
            'completed_at' => null,
        ];
    }

    /**
     * Indicate that the stop is a pickup point.
     */
    public function pickup(): static
    {
        return $this->state(fn (array $attributes): array => [
            'type' => TripStop::TYPE_PICKUP,
        ]);
    }

    /**
     * Indicate that the stop has been completed.
     */
    public function completed(): static
    {
        return $this->state(fn (array $attributes): array => [
            'status' => TripStop::STATUS_COMPLETED,
            'arrived_at' => now()->subMinutes(30),
            'completed_at' => now(),
        ]);
    }
}
