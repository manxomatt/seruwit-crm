<?php

namespace Modules\FleetFuel\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\Fleet\Models\Vehicle;
use Modules\FleetFuel\Models\FuelLog;

/**
 * @extends Factory<FuelLog>
 */
class FuelLogFactory extends Factory
{
    /**
     * @var class-string<FuelLog>
     */
    protected $model = FuelLog::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $liters = fake()->randomFloat(2, 5, 80);

        return [
            'vehicle_id' => Vehicle::factory(),
            'filled_at' => fake()->dateTimeBetween('-1 month', 'now'),
            'liters' => $liters,
            'cost' => $liters * fake()->randomFloat(2, 10000, 15000),
            'odometer_km' => fake()->optional()->numberBetween(0, 150000),
            'station_name' => fake()->optional()->company(),
            'is_full_tank' => fake()->boolean(70),
            'odometer_source' => fake()->optional()->randomElement(['manual', 'vehicle', 'gps']),
            'notes' => fake()->optional()->sentence(),
        ];
    }
}
