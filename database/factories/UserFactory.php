<?php

namespace Database\Factories;

use App\Models\Role;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\User>
 */
class UserFactory extends Factory
{
    /**
     * The current password being used by the factory.
     */
    protected static ?string $password;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'username' => null,
            'email' => fake()->unique()->safeEmail(),
            'email_verified_at' => now(),
            'password' => static::$password ??= Hash::make('password'),
            'remember_token' => Str::random(10),
        ];
    }

    /**
     * Indicate that the model's email address should be unverified.
     */
    public function unverified(): static
    {
        return $this->state(fn (array $attributes) => [
            'email_verified_at' => null,
        ]);
    }

    /**
     * Assign the admin role to the user after creation.
     */
    public function admin(): static
    {
        return $this->afterCreating(function ($user) {
            $adminRole = Role::where('slug', 'admin')->first();
            if ($adminRole) {
                $user->roles()->attach($adminRole);
            }
        });
    }

    /**
     * Assign the user role to the user after creation.
     */
    public function withUserRole(): static
    {
        return $this->afterCreating(function ($user) {
            $userRole = Role::where('slug', 'user')->first();
            if ($userRole) {
                $user->roles()->attach($userRole);
            }
        });
    }

    /**
     * Assign a custom role to the user after creation.
     */
    public function withRole(string $roleSlug): static
    {
        return $this->afterCreating(function ($user) use ($roleSlug) {
            $role = Role::where('slug', $roleSlug)->first();
            if ($role) {
                $user->roles()->attach($role);
            }
        });
    }
}
