<?php

namespace Modules\Fleet\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\Fleet\Models\Vehicle;

/**
 * @extends Factory<Vehicle>
 */
class VehicleFactory extends Factory
{
    /**
     * Factory::modelName() infers App\Models from the factory's own name, so a
     * module factory has to state its model outright.
     *
     * @var class-string<Vehicle>
     */
    protected $model = Vehicle::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->words(2, true),
            'plate_number' => strtoupper(fake()->bothify('B #### ???')),
            'type' => fake()->randomElement(['car', 'truck', 'van', 'motorcycle', 'bus']),
            'brand' => fake()->randomElement(['Toyota', 'Mitsubishi', 'Isuzu', 'Hino', 'Daihatsu']),
            'model_year' => fake()->numberBetween(2015, 2026),
            'capacity' => fake()->randomElement(['1200 kg', '2000 kg', '5 seats', '12 seats']),
            'fuel_type' => fake()->randomElement(['petrol', 'diesel', 'electric', 'hybrid']),
            'status' => 'active',
            'odometer_km' => fake()->numberBetween(0, 150000),
            'stnk_expires_at' => fake()->dateTimeBetween('now', '+1 year'),
            'kir_expires_at' => fake()->optional()->dateTimeBetween('now', '+1 year'),
            'photo_url' => null,
            'notes' => fake()->optional()->sentence(),
        ];
    }

    /**
     * Indicate that the vehicle is under maintenance.
     */
    public function maintenance(): static
    {
        return $this->state(fn (array $attributes): array => [
            'status' => 'maintenance',
        ]);
    }

    /**
     * Indicate that the vehicle is retired from service.
     */
    public function retired(): static
    {
        return $this->state(fn (array $attributes): array => [
            'status' => 'retired',
        ]);
    }
}
