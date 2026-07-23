<?php

namespace Modules\Product\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\Product\Models\Product;
use Modules\Product\Models\ProductPackaging;

/**
 * @extends Factory<ProductPackaging>
 */
class ProductPackagingFactory extends Factory
{
    /** @var class-string<ProductPackaging> */
    protected $model = ProductPackaging::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'product_id' => Product::factory(),
            'name' => fake()->randomElement(['Box', 'Karton', 'Pallet', 'Sachet', 'Pack', 'Dozen']),
            'barcode' => fake()->optional()->ean13(),
            'qty' => fake()->randomFloat(4, 1, 100),
            'sort' => fake()->numberBetween(0, 10),
        ];
    }
}
