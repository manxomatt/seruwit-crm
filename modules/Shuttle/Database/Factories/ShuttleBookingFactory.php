<?php

namespace Modules\Shuttle\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\Partners\Models\Partner;
use Modules\Shuttle\Models\ShuttleBooking;
use Modules\Shuttle\Models\ShuttleDeparture;

/**
 * @extends Factory<ShuttleBooking>
 */
class ShuttleBookingFactory extends Factory
{
    protected $model = ShuttleBooking::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $fare = 200000;

        return [
            'booking_number' => sprintf('BK-%s-%05d', now()->format('Y'), fake()->unique()->numberBetween(1, 99999)),
            'departure_id' => ShuttleDeparture::factory(),
            'partner_id' => Partner::factory(),
            'status' => ShuttleBooking::STATUS_DRAFT,
            'passenger_count' => 1,
            'unit_fare' => $fare,
            'total_fare' => $fare,
            'pickup_mode' => ShuttleBooking::MODE_POOL,
            'dropoff_mode' => ShuttleBooking::MODE_POOL,
        ];
    }

    public function walkIn(): static
    {
        return $this->state(fn (): array => [
            'partner_id' => null,
        ]);
    }

    public function confirmed(): static
    {
        return $this->state(fn (): array => [
            'status' => ShuttleBooking::STATUS_CONFIRMED,
        ]);
    }

    public function doorPickup(): static
    {
        return $this->state(fn (): array => [
            'pickup_mode' => ShuttleBooking::MODE_DOOR,
            'pickup_address' => fake()->address(),
            'pickup_lat' => fake()->latitude(-6.4, -6.1),
            'pickup_lng' => fake()->longitude(106.7, 106.9),
        ]);
    }

    public function doorDropoff(): static
    {
        return $this->state(fn (): array => [
            'dropoff_mode' => ShuttleBooking::MODE_DOOR,
            'dropoff_address' => fake()->address(),
            'dropoff_lat' => fake()->latitude(-6.95, -6.85),
            'dropoff_lng' => fake()->longitude(107.55, 107.65),
        ]);
    }
}
