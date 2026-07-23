<?php

namespace Modules\Canvassing\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\Canvassing\Models\CanvassingPlan;
use Modules\Canvassing\Models\Salesperson;

/**
 * @extends Factory<CanvassingPlan>
 */
class CanvassingPlanFactory extends Factory
{
    protected $model = CanvassingPlan::class;

    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'salesperson_id' => Salesperson::factory(),
            'plan_date' => fake()->dateTimeBetween('-1 month', '+1 month')->format('Y-m-d'),
            'notes' => fake()->optional()->sentence(),
            'status' => CanvassingPlan::STATUS_PLANNED,
        ];
    }

    public function completed(): static
    {
        return $this->state(['status' => CanvassingPlan::STATUS_COMPLETED]);
    }

    public function cancelled(): static
    {
        return $this->state(['status' => CanvassingPlan::STATUS_CANCELLED]);
    }
}
