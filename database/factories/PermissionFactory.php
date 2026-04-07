<?php

namespace Database\Factories;

use App\Models\Permission;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Permission>
 */
class PermissionFactory extends Factory
{
    protected $model = Permission::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $module = fake()->randomElement(Permission::MODULES);
        $action = fake()->randomElement(Permission::ACTIONS);

        return [
            'name' => ucfirst($action).' '.ucfirst(str_replace('-', ' ', $module)),
            'slug' => "{$module}.{$action}",
            'module' => $module,
            'action' => $action,
            'description' => "Can {$action} {$module}",
        ];
    }

    /**
     * Create a permission for a specific module and action.
     */
    public function forModuleAction(string $module, string $action): static
    {
        return $this->state(fn (array $attributes) => [
            'name' => ucfirst($action).' '.ucfirst(str_replace('-', ' ', $module)),
            'slug' => "{$module}.{$action}",
            'module' => $module,
            'action' => $action,
            'description' => "Can {$action} {$module}",
        ]);
    }
}
