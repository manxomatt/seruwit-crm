<?php

namespace Modules\Inventory\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\Inventory\Models\Warehouse;
use Modules\Inventory\Models\WarehouseLocation;

/**
 * @extends Factory<WarehouseLocation>
 */
class WarehouseLocationFactory extends Factory
{
    protected $model = WarehouseLocation::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'warehouse_id' => Warehouse::factory(),
            'name' => fake()->randomElement(['Rak A', 'Rak B', 'Rak C', 'Zona 1', 'Zona 2']),
            'code' => strtoupper(fake()->unique()->bothify('LOC-##??')),
            'type' => 'internal',
            'is_default' => false,
            'sort_order' => 0,
        ];
    }

    public function stock(): static
    {
        return $this->state(['name' => 'Stock', 'code' => 'STOCK', 'type' => 'internal', 'is_default' => true]);
    }

    public function input(): static
    {
        return $this->state(['name' => 'Input', 'code' => 'INPUT', 'type' => 'input', 'is_default' => true]);
    }

    public function output(): static
    {
        return $this->state(['name' => 'Output', 'code' => 'OUTPUT', 'type' => 'output', 'is_default' => true]);
    }
}
