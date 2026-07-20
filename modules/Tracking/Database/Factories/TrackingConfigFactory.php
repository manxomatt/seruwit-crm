<?php

namespace Modules\Tracking\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\Tracking\Models\TrackingConfig;

/**
 * @extends Factory<TrackingConfig>
 */
class TrackingConfigFactory extends Factory
{
    /**
     * Factory::modelName() infers App\Models from the factory's own name, so a
     * module factory has to state its model outright.
     *
     * @var class-string<TrackingConfig>
     */
    protected $model = TrackingConfig::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'base_url' => 'https://gps.example.test',
            'auth_type' => TrackingConfig::AUTH_BASIC,
            'email' => 'ops@example.test',
            'password' => 'secret',
            'token' => null,
            'poll_enabled' => true,
            'geofence_radius_m' => 200,
            'checkpoint_min_distance_m' => 200,
            'checkpoint_min_interval_minutes' => 5,
            'retention_days' => 90,
        ];
    }

    /**
     * Indicate that the tenant authenticates with an API token.
     */
    public function withToken(string $token = 'test-token'): static
    {
        return $this->state(fn (array $attributes): array => [
            'auth_type' => TrackingConfig::AUTH_TOKEN,
            'email' => null,
            'password' => null,
            'token' => $token,
        ]);
    }

    /**
     * Indicate that polling is switched off for this tenant.
     */
    public function disabled(): static
    {
        return $this->state(fn (array $attributes): array => [
            'poll_enabled' => false,
        ]);
    }
}
