<?php

namespace Modules\TransportationManagement\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\Fleet\Models\Driver;
use Modules\Fleet\Models\Vehicle;
use Modules\TransportationManagement\Models\TripSchedule;

/**
 * @extends Factory<TripSchedule>
 */
class TripScheduleFactory extends Factory
{
    /**
     * Factory resolution assumes App\Models, so a module factory has to state
     * its model outright.
     *
     * @var class-string<TripSchedule>
     */
    protected $model = TripSchedule::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'vehicle_id' => Vehicle::factory(),
            'driver_id' => Driver::factory(),
            'origin' => fake()->city(),
            'destination' => fake()->city(),
            'cargo_notes' => fake()->optional()->sentence(),
            'distance_km' => fake()->optional()->randomFloat(2, 5, 500),
            'days_of_week' => [1, 4], // Monday and Thursday
            'time_of_day' => '08:00:00',
            'starts_on' => now()->toDateString(),
            'ends_on' => null,
            'is_active' => true,
        ];
    }

    /**
     * Indicate that the schedule is paused.
     */
    public function inactive(): static
    {
        return $this->state(fn (array $attributes): array => [
            'is_active' => false,
        ]);
    }
}
