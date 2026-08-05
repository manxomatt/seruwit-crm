<?php

namespace Modules\Tracking\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\Fleet\Models\Vehicle;
use Modules\Tracking\Models\GpsDevice;
use Modules\Tracking\Models\GpsSource;

/**
 * @extends Factory<GpsDevice>
 */
class GpsDeviceFactory extends Factory
{
    /**
     * @var class-string<GpsDevice>
     */
    protected $model = GpsDevice::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'gps_source_id' => GpsSource::factory(),
            'vehicle_id' => null,
            'external_device_id' => fake()->unique()->numberBetween(1, 999999),
            'unique_id' => (string) fake()->unique()->numerify('###############'),
            'name' => fake()->words(2, true),
            'status' => 'online',
            'last_seen_at' => now(),
            'last_latitude' => null,
            'last_longitude' => null,
            'last_speed_kph' => null,
            'last_course' => null,
            'last_recorded_at' => null,
            'provider_total_distance_m' => null,
            'accumulated_distance_m' => 0,
            'odometer_base_km' => 0,
        ];
    }

    public function forSource(GpsSource $source): static
    {
        return $this->state(fn (array $attributes): array => [
            'gps_source_id' => $source->id,
        ]);
    }

    public function pairedTo(Vehicle $vehicle): static
    {
        return $this->state(fn (array $attributes): array => [
            'vehicle_id' => $vehicle->id,
            'odometer_base_km' => $vehicle->odometer_km,
        ]);
    }

    public function at(float $latitude, float $longitude, ?string $recordedAt = null): static
    {
        return $this->state(fn (array $attributes): array => [
            'last_latitude' => $latitude,
            'last_longitude' => $longitude,
            'last_recorded_at' => $recordedAt ?? now()->subMinute(),
        ]);
    }
}
