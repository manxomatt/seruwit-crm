<?php

namespace Modules\Tracking\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\Tracking\Models\GpsDevice;
use Modules\Tracking\Models\VehiclePosition;

/**
 * @extends Factory<VehiclePosition>
 */
class VehiclePositionFactory extends Factory
{
    /**
     * Factory::modelName() infers App\Models from the factory's own name, so a
     * module factory has to state its model outright.
     *
     * @var class-string<VehiclePosition>
     */
    protected $model = VehiclePosition::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'gps_device_id' => GpsDevice::factory(),
            'vehicle_id' => null,
            'latitude' => fake()->latitude(-8, -6),
            'longitude' => fake()->longitude(106, 108),
            'speed_kph' => fake()->randomFloat(2, 0, 90),
            'course' => fake()->randomFloat(2, 0, 359),
            'altitude' => null,
            'ignition' => true,
            'motion' => true,
            'total_distance_m' => null,
            'recorded_at' => now(),
            'server_time' => now(),
            'attributes' => null,
            'created_at' => now(),
        ];
    }

    /**
     * Indicate the exact point and time of the fix.
     */
    public function at(float $latitude, float $longitude, ?string $recordedAt = null): static
    {
        return $this->state(fn (array $attributes): array => [
            'latitude' => $latitude,
            'longitude' => $longitude,
            'recorded_at' => $recordedAt ?? now(),
        ]);
    }
}
