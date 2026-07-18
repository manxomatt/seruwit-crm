<?php

namespace Modules\Product\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\Product\Models\Product;

/**
 * @extends Factory<Product>
 */
class ProductFactory extends Factory
{
    /**
     * Factory resolution assumes App\Models, so a module factory has to state
     * its model outright.
     *
     * @var class-string<Product>
     */
    protected $model = Product::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'code' => 'PROD-'.fake()->unique()->numerify('######'),
            'name' => fake()->words(3, true),
            'unit' => fake()->randomElement(['pcs', 'kg', 'box', 'liter', 'sak']),
            'description' => fake()->optional()->sentence(),
            'price' => fake()->optional()->randomFloat(2, 1000, 500000),
            'status' => 'active',
        ];
    }

    /**
     * Indicate that the product is inactive.
     */
    public function inactive(): static
    {
        return $this->state(fn (array $attributes): array => [
            'status' => 'inactive',
        ]);
    }
}
