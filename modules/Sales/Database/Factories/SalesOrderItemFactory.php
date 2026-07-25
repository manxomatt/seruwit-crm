<?php

namespace Modules\Sales\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\Product\Models\Product;
use Modules\Sales\Models\SalesOrder;
use Modules\Sales\Models\SalesOrderItem;

/**
 * @extends Factory<SalesOrderItem>
 */
class SalesOrderItemFactory extends Factory
{
    protected $model = SalesOrderItem::class;

    public function definition(): array
    {
        return [
            'sales_order_id' => SalesOrder::factory(),
            'product_id' => Product::factory(),
            'product_packaging_id' => null,
            'quantity_ordered' => fake()->randomFloat(2, 1, 100),
            'quantity_delivered' => 0,
            'unit_price' => fake()->randomFloat(2, 1000, 100000),
            'unit' => 'pcs',
            'notes' => null,
        ];
    }
}
