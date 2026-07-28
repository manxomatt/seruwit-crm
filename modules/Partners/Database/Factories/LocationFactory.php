<?php

namespace Modules\Partners\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\Partners\Models\Location;

/**
 * @extends Factory<Location>
 */
class LocationFactory extends Factory
{
    /**
     * @var class-string<Location>
     */
    protected $model = Location::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $city = fake()->city();

        return [
            'code' => strtoupper(fake()->unique()->bothify('LOC-####')),
            'name' => $city,
            'address' => fake()->streetAddress(),
            'city' => $city,
            'province' => fake()->state(),
            'zip' => fake()->postcode(),
            'latitude' => fake()->latitude(-6.5, -5.5),
            'longitude' => fake()->longitude(106.5, 107.5),
            'is_active' => true,
        ];
    }

    public function inactive(): static
    {
        return $this->state(fn (array $attributes): array => [
            'is_active' => false,
        ]);
    }
}
