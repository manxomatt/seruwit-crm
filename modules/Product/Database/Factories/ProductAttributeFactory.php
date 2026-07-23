<?php

namespace Modules\Product\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\Product\Models\ProductAttribute;

/**
 * @extends Factory<ProductAttribute>
 */
class ProductAttributeFactory extends Factory
{
    /** @var class-string<ProductAttribute> */
    protected $model = ProductAttribute::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->unique()->word(),
            'type' => fake()->randomElement(['select', 'color', 'radio', 'checkbox']),
            'sort' => fake()->numberBetween(0, 100),
        ];
    }
}
