<?php

namespace Modules\Shuttle\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\Shuttle\Models\ShuttleCorridor;

/**
 * @extends Factory<ShuttleCorridor>
 */
class ShuttleCorridorFactory extends Factory
{
    protected $model = ShuttleCorridor::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $origin = fake()->randomElement(['Jakarta', 'Bandung', 'Bogor']);
        $destination = fake()->randomElement(['Bandung', 'Jakarta', 'Cirebon']);

        return [
            'code' => strtoupper(fake()->unique()->bothify('???-???')),
            'name' => "{$origin} – {$destination}",
            'origin_city' => $origin,
            'destination_city' => $destination,
            'base_fare' => 200000,
            'estimated_duration_minutes' => 180,
            'distance_km' => 150,
            'is_active' => true,
        ];
    }
}
