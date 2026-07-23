<?php

namespace Modules\Partners\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\Partners\Models\PartnerIndustry;

/** @extends Factory<PartnerIndustry> */
class PartnerIndustryFactory extends Factory
{
    protected $model = PartnerIndustry::class;

    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'name' => fake()->randomElement([
                'Logistik', 'Manufaktur', 'Perdagangan', 'Jasa Keuangan',
                'Teknologi', 'Pertanian', 'Konstruksi', 'Pertambangan',
                'Kesehatan', 'Pendidikan', 'Makanan & Minuman', 'Retail',
            ]),
            'description' => fake()->optional()->sentence(),
            'is_active' => true,
        ];
    }
}
