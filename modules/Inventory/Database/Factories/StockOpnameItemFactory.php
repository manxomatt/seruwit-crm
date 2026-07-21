<?php

namespace Modules\Inventory\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\Inventory\Models\StockOpname;
use Modules\Inventory\Models\StockOpnameItem;
use Modules\Product\Models\Product;

class StockOpnameItemFactory extends Factory
{
    protected $model = StockOpnameItem::class;

    public function definition(): array
    {
        return [
            'opname_id' => StockOpname::factory(),
            'product_id' => Product::factory(),
            'system_qty' => fake()->randomFloat(2, 0, 100),
            'actual_qty' => null,
            'notes' => fake()->optional()->sentence(),
        ];
    }
}
