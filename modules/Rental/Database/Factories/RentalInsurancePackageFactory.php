<?php

namespace Modules\Rental\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\Rental\Models\RentalInsurancePackage;

/** @extends Factory<RentalInsurancePackage> */
class RentalInsurancePackageFactory extends Factory
{
    protected $model = RentalInsurancePackage::class;

    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'code' => fake()->unique()->lexify('pkg_????'),
            'name' => 'CDW Standard',
            'period_type' => 'daily',
            'amount' => 75000,
            'deductible_amount' => 500000,
            'coverage_limit' => 50000000,
            'description' => 'Collision Damage Waiver',
            'is_active' => true,
            'sort_order' => 1,
        ];
    }
}
