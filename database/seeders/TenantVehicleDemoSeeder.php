<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Schema;
use Modules\Fleet\Models\Vehicle;

/**
 * Seeds 30 demo fleet vehicles (trucks, vans, pickups, box).
 *
 *   php artisan tenants:seed --class=TenantVehicleDemoSeeder --tenants={id}
 */
class TenantVehicleDemoSeeder extends Seeder
{
    public const TAG = 'vehicle-demo';

    public const PLATE_PREFIX = 'BE VD';

    public function run(): void
    {
        if (! class_exists(Vehicle::class) || ! Schema::hasTable('vehicles')) {
            $this->command?->warn('Fleet vehicles table missing. Install the fleet module first.');

            return;
        }

        $created = 0;
        $updated = 0;

        foreach ($this->definitions() as $def) {
            $plate = $def['plate_number'];
            unset($def['plate_number']);

            $vehicle = Vehicle::query()->updateOrCreate(
                ['plate_number' => $plate],
                $def,
            );

            if ($vehicle->wasRecentlyCreated) {
                $created++;
            } else {
                $updated++;
            }
        }

        $this->command?->info(sprintf(
            'Vehicle demo ready: 30 plates (%s ##). Created %d, updated %d. Total fleet now %d.',
            self::PLATE_PREFIX,
            $created,
            $updated,
            Vehicle::query()->count(),
        ));
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function definitions(): array
    {
        $templates = [
            [
                'name' => 'Truk Hino Dutro',
                'type' => 'truck',
                'brand' => 'Hino',
                'capacity_kg' => 5000,
                'cost_per_km' => 4500,
                'fuel_type' => 'diesel',
                'tank_capacity_liters' => 100,
                'expected_km_per_liter' => 7.5,
            ],
            [
                'name' => 'Truk Isuzu Elf',
                'type' => 'truck',
                'brand' => 'Isuzu',
                'capacity_kg' => 4000,
                'cost_per_km' => 4000,
                'fuel_type' => 'diesel',
                'tank_capacity_liters' => 90,
                'expected_km_per_liter' => 8.0,
            ],
            [
                'name' => 'Truk Mitsubishi Fuso',
                'type' => 'truck',
                'brand' => 'Mitsubishi',
                'capacity_kg' => 8000,
                'cost_per_km' => 5500,
                'fuel_type' => 'diesel',
                'tank_capacity_liters' => 200,
                'expected_km_per_liter' => 5.5,
            ],
            [
                'name' => 'Van Daihatsu Gran Max',
                'type' => 'van',
                'brand' => 'Daihatsu',
                'capacity_kg' => 1000,
                'cost_per_km' => 1800,
                'fuel_type' => 'petrol',
                'tank_capacity_liters' => 45,
                'expected_km_per_liter' => 12.0,
            ],
            [
                'name' => 'Van Suzuki Carry',
                'type' => 'van',
                'brand' => 'Suzuki',
                'capacity_kg' => 800,
                'cost_per_km' => 1500,
                'fuel_type' => 'petrol',
                'tank_capacity_liters' => 40,
                'expected_km_per_liter' => 13.0,
            ],
            [
                'name' => 'Box Mitsubishi L300',
                'type' => 'van',
                'brand' => 'Mitsubishi',
                'capacity_kg' => 1200,
                'cost_per_km' => 2000,
                'fuel_type' => 'petrol',
                'tank_capacity_liters' => 50,
                'expected_km_per_liter' => 11.0,
            ],
            [
                'name' => 'Pickup Toyota Hilux',
                'type' => 'truck',
                'brand' => 'Toyota',
                'capacity_kg' => 1000,
                'cost_per_km' => 2200,
                'fuel_type' => 'diesel',
                'tank_capacity_liters' => 80,
                'expected_km_per_liter' => 10.0,
            ],
            [
                'name' => 'Pickup Isuzu D-Max',
                'type' => 'truck',
                'brand' => 'Isuzu',
                'capacity_kg' => 1100,
                'cost_per_km' => 2300,
                'fuel_type' => 'diesel',
                'tank_capacity_liters' => 76,
                'expected_km_per_liter' => 9.5,
            ],
            [
                'name' => 'Truk Hino 500',
                'type' => 'truck',
                'brand' => 'Hino',
                'capacity_kg' => 10000,
                'cost_per_km' => 6500,
                'fuel_type' => 'diesel',
                'tank_capacity_liters' => 200,
                'expected_km_per_liter' => 4.5,
            ],
            [
                'name' => 'Mobil Box Toyota Dyna',
                'type' => 'truck',
                'brand' => 'Toyota',
                'capacity_kg' => 3000,
                'cost_per_km' => 3500,
                'fuel_type' => 'diesel',
                'tank_capacity_liters' => 100,
                'expected_km_per_liter' => 8.5,
            ],
        ];

        /** @var array<int, string> $statuses */
        $statuses = [
            26 => 'maintenance',
            27 => 'maintenance',
            28 => 'maintenance',
            29 => 'retired',
            30 => 'out_of_service',
        ];

        $defs = [];

        for ($i = 1; $i <= 30; $i++) {
            $template = $templates[($i - 1) % count($templates)];
            $capacityKg = (int) $template['capacity_kg'];
            $year = 2017 + (($i - 1) % 8);
            $status = $statuses[$i] ?? Vehicle::STATUS_ACTIVE;

            $defs[] = [
                'plate_number' => sprintf('%s %02d', self::PLATE_PREFIX, $i),
                'name' => sprintf('%s #%02d', $template['name'], $i),
                'type' => $template['type'],
                'brand' => $template['brand'],
                'model_year' => $year,
                'capacity' => $capacityKg.' kg',
                'capacity_kg' => $capacityKg,
                'cost_per_km' => $template['cost_per_km'],
                'tank_capacity_liters' => $template['tank_capacity_liters'],
                'expected_km_per_liter' => $template['expected_km_per_liter'],
                'fuel_type' => $template['fuel_type'],
                'status' => $status,
                'odometer_km' => 8000 + ($i * 1370),
                'stnk_expires_at' => now()->addMonths(6 + ($i % 12))->toDateString(),
                'kir_expires_at' => now()->addMonths(3 + ($i % 10))->toDateString(),
                'notes' => 'Demo fleet seed ['.self::TAG.']',
            ];
        }

        return $defs;
    }
}
