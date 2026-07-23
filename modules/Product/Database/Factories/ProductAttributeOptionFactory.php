<?php

namespace Modules\Product\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\Product\Models\ProductAttribute;
use Modules\Product\Models\ProductAttributeOption;

/**
 * @extends Factory<ProductAttributeOption>
 */
class ProductAttributeOptionFactory extends Factory
{
    /** @var class-string<ProductAttributeOption> */
    protected $model = ProductAttributeOption::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'attribute_id' => ProductAttribute::factory(),
            'name' => fake()->word(),
            'color' => fake()->optional()->hexColor(),
            'extra_price' => fake()->optional()->randomFloat(4, 0, 50000),
            'sort' => fake()->numberBetween(0, 100),
        ];
    }
}
