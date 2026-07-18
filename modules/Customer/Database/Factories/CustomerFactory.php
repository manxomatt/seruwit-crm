<?php

namespace Modules\Customer\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\Customer\Models\Customer;

/**
 * @extends Factory<Customer>
 */
class CustomerFactory extends Factory
{
    /**
     * Factory resolution assumes App\Models, so a module factory has to state
     * its model outright.
     *
     * @var class-string<Customer>
     */
    protected $model = Customer::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'code' => 'CUST-'.fake()->unique()->numerify('######'),
            'name' => fake()->company(),
            'email' => fake()->optional()->safeEmail(),
            'phone' => fake()->numerify('08##########'),
            'address' => fake()->optional()->address(),
            'notes' => fake()->optional()->sentence(),
            'status' => 'active',
        ];
    }

    /**
     * Indicate that the customer is inactive.
     */
    public function inactive(): static
    {
        return $this->state(fn (array $attributes): array => [
            'status' => 'inactive',
        ]);
    }
}
