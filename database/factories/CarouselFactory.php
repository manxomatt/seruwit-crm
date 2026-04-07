<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Carousel>
 */
class CarouselFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $name = fake()->words(3, true);

        return [
            'user_id' => User::factory(),
            'name' => ucfirst($name),
            'slug' => Str::slug($name).'-'.fake()->unique()->randomNumber(5),
            'description' => fake()->optional()->sentence(),
            'is_active' => fake()->boolean(80),
            'autoplay_interval' => fake()->randomElement([3000, 4000, 5000, 6000, 7000]),
            'show_navigation' => fake()->boolean(90),
            'show_indicators' => fake()->boolean(85),
        ];
    }

    /**
     * Indicate that the carousel is active.
     */
    public function active(): static
    {
        return $this->state(fn (array $attributes): array => [
            'is_active' => true,
        ]);
    }

    /**
     * Indicate that the carousel is inactive.
     */
    public function inactive(): static
    {
        return $this->state(fn (array $attributes): array => [
            'is_active' => false,
        ]);
    }

    /**
     * Indicate that the carousel has no navigation.
     */
    public function withoutNavigation(): static
    {
        return $this->state(fn (array $attributes): array => [
            'show_navigation' => false,
        ]);
    }

    /**
     * Indicate that the carousel has no indicators.
     */
    public function withoutIndicators(): static
    {
        return $this->state(fn (array $attributes): array => [
            'show_indicators' => false,
        ]);
    }
}
