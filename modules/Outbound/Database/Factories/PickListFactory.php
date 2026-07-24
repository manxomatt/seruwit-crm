<?php

namespace Modules\Outbound\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\Inventory\Models\Warehouse;
use Modules\Orders\Models\DeliveryOrder;
use Modules\Outbound\Models\PickList;

/**
 * @extends Factory<PickList>
 */
class PickListFactory extends Factory
{
    protected $model = PickList::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'code' => PickList::nextCode(),
            'delivery_order_id' => DeliveryOrder::factory(),
            'warehouse_id' => Warehouse::factory(),
            'status' => PickList::STATUS_OPEN,
            'generated_at' => now(),
        ];
    }
}
