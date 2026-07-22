<?php

namespace Modules\Product\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\Product\Models\Principal;

/** @extends Factory<Principal> */
class PrincipalFactory extends Factory
{
    protected $model = Principal::class;

    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'code' => 'PRC-'.fake()->unique()->numerify('######'),
            'name' => fake()->randomElement([
                'PT Unilever Indonesia',
                'PT Indofood CBP',
                'PT Wings Surya',
                'PT Mayora Indah',
                'PT Nutrifood Indonesia',
                'PT Siantar Top',
                'PT Garuda Food',
                'PT ABC President',
                'PT Kalbe Farma',
                'PT Orang Tua Group',
            ]),
            'contact_person' => fake()->name(),
            'phone' => fake()->phoneNumber(),
            'email' => fake()->companyEmail(),
            'address' => fake()->address(),
            'status' => 'active',
        ];
    }

    public function inactive(): static
    {
        return $this->state(fn (): array => ['status' => 'inactive']);
    }
}
