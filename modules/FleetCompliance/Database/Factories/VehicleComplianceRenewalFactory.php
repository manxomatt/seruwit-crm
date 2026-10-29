<?php

namespace Modules\FleetCompliance\Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\Fleet\Models\Vehicle;
use Modules\FleetCompliance\Models\VehicleComplianceRenewal;

/**
 * @extends Factory<VehicleComplianceRenewal>
 */
class VehicleComplianceRenewalFactory extends Factory
{
    protected $model = VehicleComplianceRenewal::class;

    public function definition(): array
    {
        return [
            'vehicle_id' => Vehicle::factory(),
            'document_type' => fake()->randomElement([
                VehicleComplianceRenewal::TYPE_STNK_ANNUAL,
                VehicleComplianceRenewal::TYPE_STNK_FIVE_YEAR,
                VehicleComplianceRenewal::TYPE_INSURANCE,
                VehicleComplianceRenewal::TYPE_KIR,
            ]),
            'previous_expires_at' => now()->subMonths(1)->toDateString(),
            'new_expires_at' => now()->addYear()->toDateString(),
            'renewal_date' => now()->toDateString(),
            'cost' => fake()->randomFloat(2, 200000, 5000000),
            'payer' => fake()->randomElement(['tenant', 'owner', 'shared']),
            'partner_id' => null,
            'reference_number' => 'REF-'.fake()->unique()->numerify('#####'),
            'notes' => fake()->sentence(),
            'created_by' => User::factory(),
        ];
    }
}
