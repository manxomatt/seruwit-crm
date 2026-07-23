<?php

namespace Modules\Billing\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\Billing\Models\Tariff;
use Modules\Partners\Models\Partner;

/**
 * @extends Factory<Tariff>
 */
class TariffFactory extends Factory
{
    /**
     * Factory::modelName() infers App\Models from the factory's own name, so a
     * module factory has to state its model outright.
     *
     * @var class-string<Tariff>
     */
    protected $model = Tariff::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'partner_id' => null,
            'origin' => fake()->unique()->city(),
            'destination' => fake()->unique()->city(),
            'price' => fake()->randomFloat(2, 100000, 5000000),
            'is_active' => true,
        ];
    }

    /**
     * Indicate that the tariff is specific to the given customer.
     */
    public function forCustomer(Partner $partner): static
    {
        return $this->state(fn (array $attributes): array => [
            'partner_id' => $partner->id,
        ]);
    }

    /**
     * Indicate that the tariff is inactive.
     */
    public function inactive(): static
    {
        return $this->state(fn (array $attributes): array => [
            'is_active' => false,
        ]);
    }
}
