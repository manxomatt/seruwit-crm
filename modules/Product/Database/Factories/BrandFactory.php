<?php

namespace Modules\Product\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\Product\Models\Brand;
use Modules\Product\Models\Principal;

/** @extends Factory<Brand> */
class BrandFactory extends Factory
{
    protected $model = Brand::class;

    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'principal_id' => Principal::factory(),
            'name' => fake()->randomElement([
                'Sunsilk', 'Dove', 'Rinso', 'Indomie', 'Pop Mie',
                'Bango', 'SoKlin', 'Mie Sedaap', 'Kopiko', 'Teh Pucuk',
            ]),
            'status' => 'active',
        ];
    }

    public function inactive(): static
    {
        return $this->state(fn (): array => ['status' => 'inactive']);
    }
}
