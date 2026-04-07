<?php

namespace Database\Factories;

use App\Models\Carousel;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\CarouselImage>
 */
class CarouselImageFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'carousel_id' => Carousel::factory(),
            'image_path' => 'carousels/'.fake()->uuid().'.jpg',
            'title' => fake()->optional(0.7)->sentence(4),
            'description' => fake()->optional(0.5)->sentence(),
            'link_url' => fake()->optional(0.4)->url(),
            'link_target' => fake()->randomElement(['_self', '_blank']),
            'button_text' => fake()->optional(0.3)->randomElement(['Learn More', 'Shop Now', 'Get Started', 'View Details']),
            'sort_order' => fake()->numberBetween(0, 10),
            'is_active' => fake()->boolean(85),
        ];
    }

    /**
     * Indicate that the image is active.
     */
    public function active(): static
    {
        return $this->state(fn (array $attributes): array => [
            'is_active' => true,
        ]);
    }

    /**
     * Indicate that the image is inactive.
     */
    public function inactive(): static
    {
        return $this->state(fn (array $attributes): array => [
            'is_active' => false,
        ]);
    }

    /**
     * Indicate that the image has a link.
     */
    public function withLink(): static
    {
        return $this->state(fn (array $attributes): array => [
            'link_url' => fake()->url(),
            'button_text' => fake()->randomElement(['Learn More', 'Shop Now', 'Get Started']),
        ]);
    }

    /**
     * Indicate that the image has no link.
     */
    public function withoutLink(): static
    {
        return $this->state(fn (array $attributes): array => [
            'link_url' => null,
            'button_text' => null,
        ]);
    }

    /**
     * Set a specific sort order.
     */
    public function sortOrder(int $order): static
    {
        return $this->state(fn (array $attributes): array => [
            'sort_order' => $order,
        ]);
    }
}
