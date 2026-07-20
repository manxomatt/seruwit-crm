<?php

namespace Modules\TransportationManagement\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\TransportationManagement\Models\Trip;
use Modules\TransportationManagement\Models\TripCheckpoint;

/**
 * @extends Factory<TripCheckpoint>
 */
class TripCheckpointFactory extends Factory
{
    /**
     * Factory::modelName() infers App\Models from the factory's own name, so a
     * module factory has to state its model outright.
     *
     * @var class-string<TripCheckpoint>
     */
    protected $model = TripCheckpoint::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'trip_id' => Trip::factory(),
            'source' => TripCheckpoint::SOURCE_MANUAL,
            'latitude' => fake()->latitude(-8, 6),
            'longitude' => fake()->longitude(95, 141),
            'note' => fake()->optional()->sentence(),
            'recorded_at' => fake()->dateTimeBetween('-1 day', 'now'),
        ];
    }

    /**
     * Indicate that the checkpoint came from a GPS fix rather than an operator.
     */
    public function fromGps(): static
    {
        return $this->state(fn (array $attributes): array => [
            'source' => TripCheckpoint::SOURCE_GPS,
            'note' => null,
        ]);
    }
}
