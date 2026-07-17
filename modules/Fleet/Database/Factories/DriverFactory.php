<?php

namespace Modules\Fleet\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\Fleet\Models\Driver;

/**
 * @extends Factory<Driver>
 */
class DriverFactory extends Factory
{
    /**
     * Factory::modelName() infers App\Models from the factory's own name, so a
     * module factory has to state its model outright.
     *
     * @var class-string<Driver>
     */
    protected $model = Driver::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'license_number' => strtoupper(fake()->bothify('SIM-########')),
            'license_type' => fake()->randomElement(['A', 'B1', 'B2']),
            'license_expires_at' => fake()->dateTimeBetween('now', '+3 years'),
            'phone' => fake()->numerify('08##########'),
            'email' => fake()->optional()->safeEmail(),
            'status' => 'available',
            'photo_url' => null,
            'notes' => fake()->optional()->sentence(),
        ];
    }

    /**
     * Indicate that the driver is currently on a trip.
     */
    public function onTrip(): static
    {
        return $this->state(fn (array $attributes): array => [
            'status' => 'on_trip',
        ]);
    }

    /**
     * Indicate that the driver is off duty.
     */
    public function offDuty(): static
    {
        return $this->state(fn (array $attributes): array => [
            'status' => 'off_duty',
        ]);
    }
}
