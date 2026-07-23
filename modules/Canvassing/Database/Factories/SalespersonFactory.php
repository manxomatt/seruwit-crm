<?php

namespace Modules\Canvassing\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\Canvassing\Models\Salesperson;

/**
 * @extends Factory<Salesperson>
 */
class SalespersonFactory extends Factory
{
    protected $model = Salesperson::class;

    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'user_id' => null,
            'name' => fake()->name(),
            'employee_code' => strtoupper(fake()->unique()->bothify('SP-####')),
            'phone' => fake()->phoneNumber(),
            'email' => fake()->safeEmail(),
            'area' => fake()->city(),
            'is_active' => true,
            'notes' => null,
        ];
    }

    public function inactive(): static
    {
        return $this->state(['is_active' => false]);
    }
}
