<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\UserProfile>
 */
class UserProfileFactory extends Factory
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
            'first_name' => fake()->firstName(),
            'last_name' => fake()->lastName(),
            'phone_number' => fake()->phoneNumber(),
            'avatar_url' => fake()->optional()->imageUrl(200, 200, 'people'),
        ];
    }

    /**
     * Indicate that the profile has no avatar.
     */
    public function withoutAvatar(): static
    {
        return $this->state(fn (array $attributes) => [
            'avatar_url' => null,
        ]);
    }

    /**
     * Indicate that the profile has minimal information.
     */
    public function minimal(): static
    {
        return $this->state(fn (array $attributes) => [
            'first_name' => null,
            'last_name' => null,
            'phone_number' => null,
            'avatar_url' => null,
        ]);
    }
}
