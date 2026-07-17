<?php

namespace Modules\Fleet\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\Fleet\Models\Vehicle;
use Modules\Fleet\Models\VehicleMaintenanceLog;

/**
 * @extends Factory<VehicleMaintenanceLog>
 */
class VehicleMaintenanceLogFactory extends Factory
{
    /**
     * Factory::modelName() infers App\Models from the factory's own name, so a
     * module factory has to state its model outright.
     *
     * @var class-string<VehicleMaintenanceLog>
     */
    protected $model = VehicleMaintenanceLog::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'vehicle_id' => Vehicle::factory(),
            'type' => fake()->randomElement(['scheduled_service', 'repair', 'inspection']),
            'description' => fake()->sentence(),
            'scheduled_date' => fake()->dateTimeBetween('-1 month', '+1 month'),
            'completed_date' => null,
            'cost' => fake()->optional()->randomFloat(2, 50000, 3000000),
            'odometer_km' => fake()->optional()->numberBetween(0, 150000),
            'status' => 'scheduled',
        ];
    }

    /**
     * Indicate that the maintenance has been completed.
     */
    public function completed(): static
    {
        return $this->state(fn (array $attributes): array => [
            'status' => 'completed',
            'completed_date' => now(),
            'cost' => fake()->randomFloat(2, 50000, 3000000),
        ]);
    }
}
