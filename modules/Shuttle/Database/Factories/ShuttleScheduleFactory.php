<?php

namespace Modules\Shuttle\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\Shuttle\Models\ShuttleCorridor;
use Modules\Shuttle\Models\ShuttleSchedule;

/**
 * @extends Factory<ShuttleSchedule>
 */
class ShuttleScheduleFactory extends Factory
{
    protected $model = ShuttleSchedule::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'corridor_id' => ShuttleCorridor::factory(),
            'code' => strtoupper(fake()->unique()->bothify('SCH-???')),
            'days_of_week' => [1, 2, 3, 4, 5],
            'departure_time' => '07:00:00',
            'seat_capacity' => 7,
            'pickup_cutoff_minutes' => 90,
            'is_active' => true,
        ];
    }
}
