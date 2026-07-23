<?php

namespace Modules\Rental\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\Rental\Models\Rental;
use Modules\Rental\Models\RentalDamage;

/**
 * @extends Factory<RentalDamage>
 */
class RentalDamageFactory extends Factory
{
    protected $model = RentalDamage::class;

    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'rental_id' => Rental::factory()->returned(),
            'description' => fake()->sentence(),
            'amount' => fake()->randomFloat(2, 50000, 5000000),
            'photo_path' => null,
            'reported_at' => now(),
        ];
    }
}
