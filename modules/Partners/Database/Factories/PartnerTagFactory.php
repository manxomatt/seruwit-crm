<?php

namespace Modules\Partners\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\Partners\Models\PartnerTag;

/** @extends Factory<PartnerTag> */
class PartnerTagFactory extends Factory
{
    protected $model = PartnerTag::class;

    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'name' => fake()->unique()->randomElement([
                'VIP', 'Premium', 'Regular', 'Wholesaler',
                'Distributor', 'Retailer', 'Government', 'BUMN',
            ]),
            'color' => fake()->optional()->hexColor(),
        ];
    }
}
