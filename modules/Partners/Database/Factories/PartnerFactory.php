<?php

namespace Modules\Partners\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\Partners\Models\Partner;

/** @extends Factory<Partner> */
class PartnerFactory extends Factory
{
    protected $model = Partner::class;

    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'code' => 'PART-'.fake()->unique()->numerify('######'),
            'account_type' => 'company',
            'sub_type' => 'customer',
            'name' => fake()->company(),
            'email' => fake()->optional()->safeEmail(),
            'phone' => fake()->numerify('08##########'),
            'mobile' => fake()->optional()->numerify('08##########'),
            'customer_rank' => 1,
            'supplier_rank' => 0,
            'status' => 'active',
        ];
    }

    public function individual(): static
    {
        return $this->state(fn (): array => [
            'account_type' => 'individual',
            'name' => fake()->name(),
            'job_title' => fake()->optional()->jobTitle(),
        ]);
    }

    public function supplier(): static
    {
        return $this->state(fn (): array => [
            'sub_type' => 'supplier',
            'customer_rank' => 0,
            'supplier_rank' => 1,
        ]);
    }

    public function customerAndSupplier(): static
    {
        return $this->state(fn (): array => [
            'customer_rank' => 1,
            'supplier_rank' => 1,
        ]);
    }

    public function inactive(): static
    {
        return $this->state(fn (): array => ['status' => 'inactive']);
    }

    public function withAddress(): static
    {
        return $this->afterCreating(function (Partner $partner): void {
            $partner->addresses()->create(
                \Modules\Partners\Database\Factories\PartnerAddressFactory::new()->definition()
            );
        });
    }
}
