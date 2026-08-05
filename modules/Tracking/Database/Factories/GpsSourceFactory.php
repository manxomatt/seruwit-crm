<?php

namespace Modules\Tracking\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\Tracking\Models\GpsSource;

/**
 * @extends Factory<GpsSource>
 */
class GpsSourceFactory extends Factory
{
    /**
     * @var class-string<GpsSource>
     */
    protected $model = GpsSource::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => 'Primary',
            'provider' => GpsSource::PROVIDER_TRACCAR,
            'base_url' => 'https://gps.example.test',
            'auth_type' => GpsSource::AUTH_BASIC,
            'email' => 'ops@example.test',
            'password' => 'secret',
            'token' => null,
            'poll_enabled' => true,
        ];
    }

    public function withToken(string $token = 'test-token'): static
    {
        return $this->state(fn (array $attributes): array => [
            'auth_type' => GpsSource::AUTH_TOKEN,
            'email' => null,
            'password' => null,
            'token' => $token,
        ]);
    }

    public function skyTrack(string $apiKey = 'sky-track-key'): static
    {
        return $this->state(fn (array $attributes): array => [
            'name' => 'Sky Track',
            'provider' => GpsSource::PROVIDER_SKY_TRACK,
            'base_url' => 'https://api.sky-track.example.test',
            'auth_type' => GpsSource::AUTH_API_KEY,
            'email' => null,
            'password' => null,
            'token' => $apiKey,
        ]);
    }

    public function gpsServer(string $apiKey = 'gps-server-key'): static
    {
        return $this->state(fn (array $attributes): array => [
            'name' => 'GPS-Server',
            'provider' => GpsSource::PROVIDER_GPS_SERVER,
            'base_url' => 'https://gsi-tracking.example.test',
            'auth_type' => GpsSource::AUTH_API_KEY,
            'email' => null,
            'password' => null,
            'token' => $apiKey,
        ]);
    }

    public function disabled(): static
    {
        return $this->state(fn (array $attributes): array => [
            'poll_enabled' => false,
        ]);
    }
}
