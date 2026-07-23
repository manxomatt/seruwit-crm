<?php

namespace Modules\Canvassing\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\Canvassing\Models\CanvassingVisit;
use Modules\Canvassing\Models\Salesperson;
use Modules\Partners\Models\Partner;

/**
 * @extends Factory<CanvassingVisit>
 */
class CanvassingVisitFactory extends Factory
{
    protected $model = CanvassingVisit::class;

    /** @return array<string, mixed> */
    public function definition(): array
    {
        $checkedIn = fake()->dateTimeBetween('-1 month', 'now');

        return [
            'salesperson_id' => Salesperson::factory(),
            'partner_id' => Partner::factory(),
            'plan_id' => null,
            'submitted_by' => null,
            'checked_in_at' => $checkedIn,
            'checked_out_at' => null,
            'latitude' => fake()->optional()->latitude(-8, -6),
            'longitude' => fake()->optional()->longitude(106, 112),
            'outcome' => CanvassingVisit::OUTCOME_PENDING,
            'notes' => null,
        ];
    }

    public function completed(): static
    {
        return $this->state(function (array $attributes): array {
            $checkedIn = $attributes['checked_in_at'] ?? now()->subHours(2);

            return [
                'checked_out_at' => (clone $checkedIn)->modify('+'.fake()->numberBetween(15, 90).' minutes'),
                'outcome' => fake()->randomElement([
                    CanvassingVisit::OUTCOME_CONTACTED,
                    CanvassingVisit::OUTCOME_INTERESTED,
                    CanvassingVisit::OUTCOME_NOT_INTERESTED,
                    CanvassingVisit::OUTCOME_CALLBACK,
                ]),
            ];
        });
    }

    public function open(): static
    {
        return $this->state(['checked_out_at' => null, 'outcome' => CanvassingVisit::OUTCOME_PENDING]);
    }
}
