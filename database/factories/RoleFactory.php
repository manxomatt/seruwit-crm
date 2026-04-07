<?php

namespace Database\Factories;

use App\Models\Role;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Role>
 */
class RoleFactory extends Factory
{
    protected $model = Role::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $name = fake()->unique()->words(2, true);

        return [
            'name' => ucwords($name),
            'slug' => Str::slug($name),
            'description' => fake()->sentence(),
            'is_system' => false,
            'dashboard_path' => '/module/dashboard',
        ];
    }

    /**
     * Indicate that the role is a system role.
     */
    public function system(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_system' => true,
        ]);
    }

    /**
     * Create an admin role with all permissions.
     */
    public function admin(): static
    {
        return $this->state(fn (array $attributes) => [
            'name' => 'Administrator',
            'slug' => 'admin',
            'description' => 'Full access to all system features',
            'is_system' => true,
            'dashboard_path' => '/module/dashboard',
        ]);
    }

    /**
     * Create a user role with view-only permissions.
     */
    public function user(): static
    {
        return $this->state(fn (array $attributes) => [
            'name' => 'User',
            'slug' => 'user',
            'description' => 'Read-only access to system features',
            'is_system' => true,
            'dashboard_path' => '/module/dashboard',
        ]);
    }

    /**
     * Set a custom dashboard path.
     */
    public function withDashboardPath(string $path): static
    {
        return $this->state(fn (array $attributes) => [
            'dashboard_path' => $path,
        ]);
    }
}
