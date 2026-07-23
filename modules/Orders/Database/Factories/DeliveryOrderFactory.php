<?php

namespace Modules\Orders\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\Orders\Models\DeliveryOrder;
use Modules\Partners\Models\Partner;
use Modules\TransportationManagement\Models\Trip;

/**
 * @extends Factory<DeliveryOrder>
 */
class DeliveryOrderFactory extends Factory
{
    /**
     * Factory::modelName() infers App\Models from the factory's own name, so a
     * module factory has to state its model outright.
     *
     * @var class-string<DeliveryOrder>
     */
    protected $model = DeliveryOrder::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'code' => 'DO-'.fake()->unique()->numerify('######'),
            'partner_id' => Partner::factory(),
            'trip_id' => null,
            'status' => DeliveryOrder::STATUS_DRAFT,
            'order_date' => fake()->dateTimeBetween('now', '+1 week'),
            'pickup_address' => fake()->address(),
            'delivery_address' => fake()->address(),
            'notes' => fake()->optional()->sentence(),
            'confirmed_at' => null,
            'delivered_at' => null,
            'cancelled_reason' => null,
        ];
    }

    /**
     * Indicate that the order has been confirmed and is awaiting a trip.
     */
    public function confirmed(): static
    {
        return $this->state(fn (array $attributes): array => [
            'status' => DeliveryOrder::STATUS_CONFIRMED,
            'confirmed_at' => now(),
        ]);
    }

    /**
     * Indicate that the order has been assigned to the given trip.
     */
    public function assigned(Trip $trip): static
    {
        return $this->state(fn (array $attributes): array => [
            'status' => DeliveryOrder::STATUS_ASSIGNED,
            'confirmed_at' => now(),
            'trip_id' => $trip->id,
        ]);
    }
}
