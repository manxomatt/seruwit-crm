<?php

namespace Modules\Rental\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\Rental\Models\Rental;
use Modules\Rental\Models\RentalExtension;

/**
 * @extends Factory<RentalExtension>
 */
class RentalExtensionFactory extends Factory
{
    protected $model = RentalExtension::class;

    /** @return array<string, mixed> */
    public function definition(): array
    {
        $original = fake()->dateTimeBetween('+1 day', '+7 days')->format('Y-m-d');
        $extended = fake()->numberBetween(1, 7);
        $newEnd = \Carbon\Carbon::parse($original)->addDays($extended)->toDateString();

        return [
            'rental_id' => Rental::factory()->active(),
            'original_end_date' => $original,
            'new_end_date' => $newEnd,
            'extended_periods' => $extended,
            'additional_amount' => fake()->randomFloat(2, 200000, 1000000),
            'notes' => null,
        ];
    }
}
