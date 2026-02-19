<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Todo>
 */
class TodoFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'title' => fake()->sentence(3),
            'description' => fake()->optional()->paragraph(),
            'is_completed' => fake()->boolean(20),
        ];
    }

    /**
     * Indicate that the todo is completed.
     */
    public function completed(): static
    {
        return $this->state(fn (array $attributes): array => [
            'is_completed' => true,
        ]);
    }

    /**
     * Indicate that the todo is not completed.
     */
    public function pending(): static
    {
        return $this->state(fn (array $attributes): array => [
            'is_completed' => false,
        ]);
    }
}
