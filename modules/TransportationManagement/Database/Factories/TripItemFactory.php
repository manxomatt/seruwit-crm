<?php

namespace Modules\TransportationManagement\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\Product\Models\Product;
use Modules\TransportationManagement\Models\Trip;
use Modules\TransportationManagement\Models\TripItem;

/**
 * @extends Factory<TripItem>
 */
class TripItemFactory extends Factory
{
    /**
     * Factory::modelName() infers App\Models from the factory's own name, so a
     * module factory has to state its model outright.
     *
     * @var class-string<TripItem>
     */
    protected $model = TripItem::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'trip_id' => Trip::factory(),
            'product_id' => Product::factory(),
            'quantity' => fake()->randomFloat(2, 1, 100),
            'notes' => fake()->optional()->sentence(),
        ];
    }
}
