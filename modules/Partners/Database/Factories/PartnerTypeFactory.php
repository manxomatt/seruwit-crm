<?php

namespace Modules\Partners\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\Partners\Models\PartnerType;

/** @extends Factory<PartnerType> */
class PartnerTypeFactory extends Factory
{
    protected $model = PartnerType::class;

    /** @return array<string, mixed> */
    public function definition(): array
    {
        $code = fake()->unique()->word();

        return [
            'code' => strtolower($code),
            'name' => ['id' => ucfirst($code), 'en' => ucfirst($code)],
            'description' => [
                'id' => fake()->optional()->sentence() ?? '',
                'en' => fake()->optional()->sentence() ?? '',
            ],
            'affects_customer_rank' => false,
            'affects_supplier_rank' => false,
            'is_active' => true,
        ];
    }

    public function customer(): static
    {
        return $this->state(fn (): array => [
            'code' => 'customer',
            'name' => ['id' => 'Customer', 'en' => 'Customer'],
            'affects_customer_rank' => true,
        ]);
    }

    public function supplier(): static
    {
        return $this->state(fn (): array => [
            'code' => 'supplier',
            'name' => ['id' => 'Supplier', 'en' => 'Supplier'],
            'affects_supplier_rank' => true,
        ]);
    }
}
