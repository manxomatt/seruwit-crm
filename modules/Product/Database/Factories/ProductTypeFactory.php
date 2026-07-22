<?php

namespace Modules\Product\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\Product\Models\ProductType;

/** @extends Factory<ProductType> */
class ProductTypeFactory extends Factory
{
    protected $model = ProductType::class;

    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'name' => fake()->randomElement([
                'Makanan', 'Minuman', 'Perawatan Tubuh', 'Perawatan Rumah',
                'Bumbu Dapur', 'Snack', 'Susu & Olahan', 'Obat & Suplemen',
            ]),
            'parent_id' => null,
            'sort_order' => 0,
        ];
    }

    public function childOf(ProductType $parent): static
    {
        return $this->state(fn (): array => ['parent_id' => $parent->id]);
    }
}
