<?php

namespace Modules\Fleet\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\Fleet\Models\FuelLog;
use Modules\Fleet\Models\Vehicle;

/**
 * @extends Factory<FuelLog>
 */
class FuelLogFactory extends Factory
{
    /**
     * Factory::modelName() infers App\Models from the factory's own name, so a
     * module factory has to state its model outright.
     *
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
        ];
    }
}
