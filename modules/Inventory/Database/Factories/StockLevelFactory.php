<?php

namespace Modules\Inventory\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\Inventory\Models\StockLevel;
use Modules\Inventory\Models\Warehouse;
use Modules\Product\Models\Product;

class StockLevelFactory extends Factory
{
    protected $model = StockLevel::class;

    public function definition(): array
    {
        return [
            'product_id' => Product::factory(),
            'warehouse_id' => Warehouse::factory(),
            'on_hand' => fake()->randomFloat(2, 0, 1000),
            'reserved' => 0,
        ];
    }
}
