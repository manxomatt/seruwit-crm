<?php

namespace Modules\Inventory\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\Inventory\Models\StockOpname;
use Modules\Inventory\Models\Warehouse;

class StockOpnameFactory extends Factory
{
    protected $model = StockOpname::class;

    public function definition(): array
    {
        return [
            'warehouse_id' => Warehouse::factory(),
            'opname_date' => fake()->date(),
            'status' => 'draft',
            'completed_at' => null,
            'created_by' => null,
        ];
    }
}
