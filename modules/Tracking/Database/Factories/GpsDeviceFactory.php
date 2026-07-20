<?php

namespace Modules\Tracking\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\Fleet\Models\Vehicle;
use Modules\Tracking\Models\GpsDevice;

/**
 * @extends Factory<GpsDevice>
 */
class GpsDeviceFactory extends Factory
{
    /**
     * Factory::modelName() infers App\Models from the factory's own name, so a
     * module factory has to state its model outright.
     *
     * @var class-string<GpsDevice>
     */
    protected $model = GpsDevice::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'vehicle_id' => null,
            'traccar_device_id' => fake()->unique()->numberBetween(1, 999999),
            'unique_id' => (string) fake()->unique()->numerify('###############'),
            'name' => fake()->words(2, true),
            'status' => 'online',
            'last_seen_at' => now(),
            'last_latitude' => null,
            'last_longitude' => null,
            'last_speed_kph' => null,
            'last_course' => null,
            'last_recorded_at' => null,
            'traccar_total_distance_m' => null,
            'accumulated_distance_m' => 0,
            'odometer_base_km' => 0,
        ];
    }

    /**
     * Indicate that the device is paired to the given vehicle, capturing the
     * vehicle's current odometer as the baseline the way pairing does.
     */
    public function pairedTo(Vehicle $vehicle): static
    {
        return $this->state(fn (array $attributes): array => [
            'vehicle_id' => $vehicle->id,
            'odometer_base_km' => $vehicle->odometer_km,
        ]);
    }

    /**
     * Indicate that the device has already reported a fix at the given point.
     */
    public function at(float $latitude, float $longitude, ?string $recordedAt = null): static
    {
        return $this->state(fn (array $attributes): array => [
            'last_latitude' => $latitude,
            'last_longitude' => $longitude,
            'last_recorded_at' => $recordedAt ?? now()->subMinute(),
        ]);
    }
}
