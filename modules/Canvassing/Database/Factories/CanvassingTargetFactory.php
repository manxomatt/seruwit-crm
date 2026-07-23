<?php

namespace Modules\Canvassing\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\Canvassing\Models\CanvassingTarget;
use Modules\Canvassing\Models\Salesperson;

/**
 * @extends Factory<CanvassingTarget>
 */
class CanvassingTargetFactory extends Factory
{
    protected $model = CanvassingTarget::class;

    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'salesperson_id' => Salesperson::factory(),
            'year' => (int) now()->format('Y'),
            'month' => (int) now()->format('n'),
            'target_visits' => fake()->numberBetween(20, 80),
            'target_new_partners' => fake()->numberBetween(5, 20),
            'notes' => null,
        ];
    }
}
