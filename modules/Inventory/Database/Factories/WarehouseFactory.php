<?php

namespace Modules\Inventory\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\Inventory\Models\Warehouse;
use Modules\Inventory\Support\WarehouseKind;

/**
 * @extends Factory<Warehouse>
 */
class WarehouseFactory extends Factory
{
    protected $model = Warehouse::class;

    public function definition(): array
    {
        return [
            'name' => $this->faker->words(2, true),
            'location' => $this->faker->address(),
            'kind' => WarehouseKind::Warehouse,
            'status' => 'active',
        ];
    }

    public function asStore(): static
    {
        return $this->state(fn (): array => ['kind' => WarehouseKind::Store]);
    }

    public function asShowroom(): static
    {
        return $this->state(fn (): array => ['kind' => WarehouseKind::Showroom]);
    }
}
