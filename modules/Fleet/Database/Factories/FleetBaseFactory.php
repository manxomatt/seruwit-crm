<?php

namespace Modules\Fleet\Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\Fleet\Models\FleetBase;
use Modules\Fleet\Support\FleetBaseKind;

/**
 * @extends Factory<FleetBase>
 */
class FleetBaseFactory extends Factory
{
    /**
     * @var class-string<FleetBase>
     */
    protected $model = FleetBase::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'code' => strtoupper(fake()->unique()->bothify('BASE-###')),
            'name' => fake()->company().' Depot',
            'kind' => FleetBaseKind::Depot->value,
            'status' => FleetBase::STATUS_ACTIVE,
            'address' => fake()->streetAddress(),
            'city' => fake()->city(),
            'province' => fake()->state(),
            'zip' => fake()->postcode(),
            'latitude' => fake()->optional()->latitude(),
            'longitude' => fake()->optional()->longitude(),
            'phone' => fake()->numerify('08##########'),
            'email' => fake()->optional()->companyEmail(),
            'opens_at' => '08:00:00',
            'closes_at' => '17:00:00',
            'timezone' => 'Asia/Jakarta',
            'vehicle_capacity' => fake()->optional()->numberBetween(5, 80),
            'allows_overnight' => true,
            'service_radius_km' => fake()->optional()->randomFloat(2, 5, 100),
            'manager_id' => User::factory(),
            'location_id' => null,
            'warehouse_id' => null,
            'notes' => fake()->optional()->sentence(),
        ];
    }

    public function inactive(): static
    {
        return $this->state(fn (array $attributes): array => [
            'status' => FleetBase::STATUS_INACTIVE,
        ]);
    }

    public function yard(): static
    {
        return $this->state(fn (array $attributes): array => [
            'kind' => FleetBaseKind::Yard->value,
        ]);
    }
}
