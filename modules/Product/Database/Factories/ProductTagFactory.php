<?php

namespace Modules\Product\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\Product\Models\ProductTag;

/**
 * @extends Factory<ProductTag>
 */
class ProductTagFactory extends Factory
{
    /** @var class-string<ProductTag> */
    protected $model = ProductTag::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->unique()->word(),
            'color' => fake()->optional()->randomElement([
                'red', 'blue', 'green', 'yellow', 'purple', 'orange', 'pink', 'gray',
            ]),
        ];
    }
}
