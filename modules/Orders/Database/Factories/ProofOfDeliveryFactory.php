<?php

namespace Modules\Orders\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\Orders\Models\DeliveryOrder;
use Modules\Orders\Models\ProofOfDelivery;

/**
 * @extends Factory<ProofOfDelivery>
 */
class ProofOfDeliveryFactory extends Factory
{
    /**
     * Factory::modelName() infers App\Models from the factory's own name, so a
     * module factory has to state its model outright.
     *
     * @var class-string<ProofOfDelivery>
     */
    protected $model = ProofOfDelivery::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'delivery_order_id' => DeliveryOrder::factory(),
            'trip_stop_id' => null,
            'recipient_name' => fake()->name(),
            'signature_path' => null,
            'notes' => fake()->optional()->sentence(),
            'latitude' => fake()->latitude(-8, -6),
            'longitude' => fake()->longitude(106, 108),
            'delivered_at' => now(),
            'submitted_by' => null,
        ];
    }
}
