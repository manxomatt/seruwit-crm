<?php

namespace Modules\Billing\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\Billing\Models\TripAllowance;
use Modules\Billing\Models\TripAllowanceExpense;

/**
 * @extends Factory<TripAllowanceExpense>
 */
class TripAllowanceExpenseFactory extends Factory
{
    /**
     * Factory::modelName() infers App\Models from the factory's own name, so a
     * module factory has to state its model outright.
     *
     * @var class-string<TripAllowanceExpense>
     */
    protected $model = TripAllowanceExpense::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'trip_allowance_id' => TripAllowance::factory(),
            'category' => fake()->randomElement(TripAllowanceExpense::CATEGORIES),
            'amount' => fake()->randomFloat(2, 10000, 500000),
            'note' => fake()->optional()->sentence(),
        ];
    }
}
