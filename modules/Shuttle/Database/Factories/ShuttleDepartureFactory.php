<?php

namespace Modules\Shuttle\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\Shuttle\Models\ShuttleCorridor;
use Modules\Shuttle\Models\ShuttleDeparture;

/**
 * @extends Factory<ShuttleDeparture>
 */
class ShuttleDepartureFactory extends Factory
{
    protected $model = ShuttleDeparture::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'corridor_id' => ShuttleCorridor::factory(),
            'departure_number' => sprintf('SH-%s-%05d', now()->format('Y'), fake()->unique()->numberBetween(1, 99999)),
            'depart_date' => now()->addDay()->toDateString(),
            'depart_time' => '07:00:00',
            'seat_capacity' => 7,
            'seats_booked' => 0,
            'status' => ShuttleDeparture::STATUS_OPEN,
        ];
    }
}
