<?php

namespace Modules\Orders\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\Orders\Models\DeliveryOrderItem;
use Modules\Orders\Models\PodItem;
use Modules\Orders\Models\ProofOfDelivery;

/**
 * @extends Factory<PodItem>
 */
class PodItemFactory extends Factory
{
    /**
     * Factory::modelName() infers App\Models from the factory's own name, so a
     * module factory has to state its model outright.
     *
     * @var class-string<PodItem>
     */
    protected $model = PodItem::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'proof_of_delivery_id' => ProofOfDelivery::factory(),
            'delivery_order_item_id' => DeliveryOrderItem::factory(),
            'accepted_quantity' => 1,
            'rejected_quantity' => 0,
            'returned_quantity' => 0,
            'reason' => null,
        ];
    }
}
