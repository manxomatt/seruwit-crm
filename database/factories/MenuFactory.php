<?php

namespace Database\Factories;

use App\Models\Menu;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Menu>
 */
class MenuFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => $this->faker->words(2, true),
            'slug' => $this->faker->unique()->slug(2),
            'icon' => $this->faker->randomElement(['dashboard', 'pages', 'posts', 'users', 'settings']),
            'route_name' => null,
            'url' => null,
            'parent_id' => null,
            'permission_module' => null,
            'permission_action' => 'view',
            'sort_order' => $this->faker->numberBetween(1, 100),
            'is_active' => true,
            'target' => '_self',
        ];
    }

    /**
     * Indicate that the menu is inactive.
     */
    public function inactive(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_active' => false,
        ]);
    }

    /**
     * Set the menu to require a specific permission module.
     */
    public function withPermission(string $module, string $action = 'view'): static
    {
        return $this->state(fn (array $attributes) => [
            'permission_module' => $module,
            'permission_action' => $action,
        ]);
    }

    /**
     * Set the menu as a child of another menu.
     */
    public function childOf(Menu $parent): static
    {
        return $this->state(fn (array $attributes) => [
            'parent_id' => $parent->id,
        ]);
    }

    /**
     * Set a route name for the menu.
     */
    public function withRoute(string $routeName): static
    {
        return $this->state(fn (array $attributes) => [
            'route_name' => $routeName,
        ]);
    }
}
