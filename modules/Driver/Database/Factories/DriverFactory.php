<?php

namespace Modules\Driver\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\Driver\Models\Driver;

/**
 * @extends Factory<Driver>
 */
class DriverFactory extends Factory
{
    protected $model = Driver::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'license_number' => fake()->unique()->numerify('SIM-########'),
            'license_type' => fake()->randomElement(['A', 'B1', 'B2', 'A Umum', 'B1 Umum', 'B2 Umum']),
            'license_expires_at' => fake()->dateTimeBetween('+1 month', '+5 years')->format('Y-m-d'),
            'phone' => fake()->phoneNumber(),
            'email' => fake()->unique()->safeEmail(),
            'status' => Driver::STATUS_AVAILABLE,
            'photo_url' => null,
            'notes' => fake()->optional()->sentence(),
        ];
    }
}
