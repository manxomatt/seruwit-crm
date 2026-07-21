<?php

namespace Modules\Inventory\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\Inventory\Models\Warehouse;

class WarehouseFactory extends Factory
{
    protected $model = Warehouse::class;

    public function definition(): array
    {
        return [
            'name' => $this->faker->words(2, true),
            'location' => $this->faker->address(),
            'status' => 'active',
        ];
    }
}
