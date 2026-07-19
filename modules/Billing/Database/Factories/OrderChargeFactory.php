<?php

namespace Modules\Billing\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\Billing\Models\OrderCharge;
use Modules\Orders\Models\DeliveryOrder;

/**
 * @extends Factory<OrderCharge>
 */
class OrderChargeFactory extends Factory
{
    /**
     * Factory::modelName() infers App\Models from the factory's own name, so a
     * module factory has to state its model outright.
     *
     * @var class-string<OrderCharge>
     */
    protected $model = OrderCharge::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'delivery_order_id' => DeliveryOrder::factory(),
            'tariff_id' => null,
            'amount' => fake()->randomFloat(2, 100000, 5000000),
        ];
    }
}
