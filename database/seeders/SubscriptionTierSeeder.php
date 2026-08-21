<?php

namespace Database\Seeders;

use App\Models\SubscriptionTier;
use Illuminate\Database\Seeder;

class SubscriptionTierSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $tiers = [
            [
                'name' => 'Tier 1 - Small',
                'min_vehicles' => 1,
                'max_vehicles' => 10,
                'price_per_vehicle' => 20000.00,
            ],
            [
                'name' => 'Tier 2 - Medium',
                'min_vehicles' => 11,
                'max_vehicles' => 50,
                'price_per_vehicle' => 15000.00,
            ],
            [
                'name' => 'Tier 3 - Large',
                'min_vehicles' => 51,
                'max_vehicles' => 999999,
                'price_per_vehicle' => 10000.00,
            ],
        ];

        foreach ($tiers as $tier) {
            SubscriptionTier::updateOrCreate(
                [
                    'min_vehicles' => $tier['min_vehicles'],
                    'max_vehicles' => $tier['max_vehicles'],
                ],
                $tier
            );
        }
    }
}
