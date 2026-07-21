<?php

namespace Modules\Inventory\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\Inventory\Models\StockMovement;
use Modules\Inventory\Models\Warehouse;
use Modules\Product\Models\Product;

class StockMovementFactory extends Factory
{
    protected $model = StockMovement::class;

    public function definition(): array
    {
        return [
            'product_id' => Product::factory(),
            'warehouse_id' => Warehouse::factory(),
            'type' => fake()->randomElement(['in', 'out', 'adjustment']),
            'quantity' => fake()->randomFloat(2, 1, 100),
            'source_type' => null,
            'source_id' => null,
            'reference_code' => 'MV-'.fake()->unique()->numerify('######'),
            'notes' => fake()->optional()->sentence(),
            'recorded_by' => null,
            'recorded_at' => now(),
        ];
    }
}
