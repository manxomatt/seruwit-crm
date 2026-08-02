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
        $id = fake()->unique()->randomElement([
            'Logistik', 'Manufaktur', 'Perdagangan', 'Jasa Keuangan',
            'Teknologi', 'Pertanian', 'Konstruksi', 'Pertambangan',
            'Kesehatan', 'Pendidikan', 'Makanan & Minuman', 'Ritel',
        ]);

        $en = match ($id) {
            'Logistik' => 'Logistics',
            'Manufaktur' => 'Manufacturing',
            'Perdagangan' => 'Trading',
            'Jasa Keuangan' => 'Financial Services',
            'Teknologi' => 'Technology',
            'Pertanian' => 'Agriculture',
            'Konstruksi' => 'Construction',
            'Pertambangan' => 'Mining',
            'Kesehatan' => 'Healthcare',
            'Pendidikan' => 'Education',
            'Makanan & Minuman' => 'Food & Beverage',
            'Ritel' => 'Retail',
            default => $id,
        };

        return [
            'code' => null,
            'name' => ['id' => $id, 'en' => $en],
            'description' => [
                'id' => fake()->optional()->sentence() ?? '',
                'en' => fake()->optional()->sentence() ?? '',
            ],
            'is_active' => true,
        ];
    }
}
