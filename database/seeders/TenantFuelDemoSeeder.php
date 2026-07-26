<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Schema;
use Modules\Fleet\Models\Driver;
use Modules\Fleet\Models\FuelLog;
use Modules\Fleet\Models\Vehicle;
use Modules\Fleet\Support\FuelLogRecorder;

/**
 * Seeds 10 demo fuel fills with computed km/L via FuelLogRecorder.
 *
 *   php artisan tenants:seed --class=TenantFuelDemoSeeder --tenants={id}
 */
class TenantFuelDemoSeeder extends Seeder
{
    public const RECEIPT_PREFIX = 'FUEL-DEMO-';

    public function run(): void
    {
        if (! class_exists(FuelLog::class) || ! Schema::hasTable('fuel_logs')) {
            $this->command?->warn('Fleet fuel_logs table missing. Install the fleet module first.');

            return;
        }

        $vehicles = $this->resolveVehicles();
        $drivers = Driver::query()->orderBy('id')->limit(5)->get()->values();
        $recorder = app(FuelLogRecorder::class);

        $fills = $this->fillDefinitions($vehicles, $drivers);
        $created = 0;

        foreach ($fills as $fill) {
            $receipt = $fill['receipt_number'];

            if (FuelLog::query()->where('receipt_number', $receipt)->exists()) {
                continue;
            }

            /** @var Vehicle $vehicle */
            $vehicle = $fill['vehicle'];
            unset($fill['vehicle']);

            $recorder->record($vehicle->fresh(), $fill);
            $created++;
        }

        $this->command?->info(sprintf(
            'Fuel demo ready: %d new fills (%d total demo receipts).',
            $created,
            FuelLog::query()->where('receipt_number', 'like', self::RECEIPT_PREFIX.'%')->count(),
        ));
    }

    /**
     * @return list<Vehicle>
     */
    protected function resolveVehicles(): array
    {
        $preferredPlates = ['BE 1001 MM', 'BE 1002 MM', 'BE 1003 MM'];
        $vehicles = Vehicle::query()
            ->whereIn('plate_number', $preferredPlates)
            ->orderBy('plate_number')
            ->get();

        if ($vehicles->count() < 2) {
            $vehicles = Vehicle::query()->orderBy('id')->limit(3)->get();
        }

        if ($vehicles->isEmpty()) {
            $vehicles = collect([
                Vehicle::query()->create([
                    'name' => 'Demo Fuel Truck',
                    'plate_number' => 'BE FUEL 01',
                    'type' => 'truck',
                    'brand' => 'Hino',
                    'model_year' => 2021,
                    'capacity_kg' => 5000,
                    'tank_capacity_liters' => 120,
                    'expected_km_per_liter' => 6.5,
                    'fuel_type' => 'diesel',
                    'status' => Vehicle::STATUS_ACTIVE,
                    'odometer_km' => 45000,
                ]),
                Vehicle::query()->create([
                    'name' => 'Demo Fuel Van',
                    'plate_number' => 'BE FUEL 02',
                    'type' => 'van',
                    'brand' => 'Mitsubishi',
                    'model_year' => 2020,
                    'capacity_kg' => 1200,
                    'tank_capacity_liters' => 55,
                    'expected_km_per_liter' => 10,
                    'fuel_type' => 'petrol',
                    'status' => Vehicle::STATUS_ACTIVE,
                    'odometer_km' => 28000,
                ]),
            ]);
        }

        foreach ($vehicles as $vehicle) {
            $updates = [];
            if ($vehicle->tank_capacity_liters === null) {
                $updates['tank_capacity_liters'] = $vehicle->type === 'truck' ? 120 : 55;
            }
            if ($vehicle->expected_km_per_liter === null) {
                $updates['expected_km_per_liter'] = $vehicle->type === 'truck' ? 6.5 : 10;
            }
            if ((int) $vehicle->odometer_km < 1000) {
                $updates['odometer_km'] = 40000 + ((int) $vehicle->id * 1000);
            }
            if ($updates !== []) {
                $vehicle->update($updates);
            }
        }

        return $vehicles->values()->all();
    }

    /**
     * @param  list<Vehicle>  $vehicles
     * @param  \Illuminate\Support\Collection<int, Driver>  $drivers
     * @return list<array<string, mixed>>
     */
    protected function fillDefinitions(array $vehicles, $drivers): array
    {
        $v1 = $vehicles[0];
        $v2 = $vehicles[1] ?? $vehicles[0];
        $v3 = $vehicles[2] ?? $vehicles[0];

        $d1 = $drivers->get(0)?->id;
        $d2 = $drivers->get(1)?->id;
        $d3 = $drivers->get(2)?->id;

        $base1 = max(40000, (int) $v1->odometer_km);
        $base2 = max(25000, (int) $v2->odometer_km);
        $base3 = max(18000, (int) $v3->odometer_km);

        return [
            // Vehicle 1 — 4 fills (normal efficiency)
            [
                'vehicle' => $v1,
                'driver_id' => $d1,
                'filled_at' => now()->subDays(45)->toDateString(),
                'liters' => 80,
                'cost' => 1120000,
                'odometer_km' => $base1,
                'odometer_source' => FuelLog::ODOMETER_SOURCE_MANUAL,
                'station_name' => 'SPBU Pertamina Kemiling',
                'receipt_number' => self::RECEIPT_PREFIX.'01',
                'is_full_tank' => true,
                'notes' => 'Demo fill baseline',
            ],
            [
                'vehicle' => $v1,
                'driver_id' => $d1,
                'filled_at' => now()->subDays(35)->toDateString(),
                'liters' => 75,
                'cost' => 1050000,
                'odometer_km' => $base1 + 480,
                'odometer_source' => FuelLog::ODOMETER_SOURCE_VEHICLE,
                'station_name' => 'SPBU Shell Rajabasa',
                'receipt_number' => self::RECEIPT_PREFIX.'02',
                'is_full_tank' => true,
            ],
            [
                'vehicle' => $v1,
                'driver_id' => $d2,
                'filled_at' => now()->subDays(22)->toDateString(),
                'liters' => 78,
                'cost' => 1092000,
                'odometer_km' => $base1 + 980,
                'odometer_source' => FuelLog::ODOMETER_SOURCE_GPS,
                'station_name' => 'SPBU Pertamina Way Halim',
                'receipt_number' => self::RECEIPT_PREFIX.'03',
                'is_full_tank' => true,
            ],
            [
                'vehicle' => $v1,
                'driver_id' => $d1,
                'filled_at' => now()->subDays(10)->toDateString(),
                'liters' => 82,
                'cost' => 1148000,
                'odometer_km' => $base1 + 1480,
                'odometer_source' => FuelLog::ODOMETER_SOURCE_VEHICLE,
                'station_name' => 'SPBU Pertamina Kemiling',
                'receipt_number' => self::RECEIPT_PREFIX.'04',
                'is_full_tank' => true,
            ],

            // Vehicle 2 — 3 fills (good van efficiency)
            [
                'vehicle' => $v2,
                'driver_id' => $d2,
                'filled_at' => now()->subDays(40)->toDateString(),
                'liters' => 40,
                'cost' => 520000,
                'odometer_km' => $base2,
                'odometer_source' => FuelLog::ODOMETER_SOURCE_MANUAL,
                'station_name' => 'SPBU BP Metro',
                'receipt_number' => self::RECEIPT_PREFIX.'05',
                'is_full_tank' => true,
            ],
            [
                'vehicle' => $v2,
                'driver_id' => $d3 ?? $d2,
                'filled_at' => now()->subDays(25)->toDateString(),
                'liters' => 38,
                'cost' => 494000,
                'odometer_km' => $base2 + 400,
                'odometer_source' => FuelLog::ODOMETER_SOURCE_VEHICLE,
                'station_name' => 'SPBU Pertamina Metro',
                'receipt_number' => self::RECEIPT_PREFIX.'06',
                'is_full_tank' => true,
            ],
            [
                'vehicle' => $v2,
                'driver_id' => $d2,
                'filled_at' => now()->subDays(8)->toDateString(),
                'liters' => 42,
                'cost' => 546000,
                'odometer_km' => $base2 + 820,
                'odometer_source' => FuelLog::ODOMETER_SOURCE_GPS,
                'station_name' => 'SPBU Shell Bandar Jaya',
                'receipt_number' => self::RECEIPT_PREFIX.'07',
                'is_full_tank' => true,
            ],

            // Vehicle 3 — 3 fills (includes one inefficient / anomaly candidate)
            [
                'vehicle' => $v3,
                'driver_id' => $d3 ?? $d1,
                'filled_at' => now()->subDays(30)->toDateString(),
                'liters' => 50,
                'cost' => 650000,
                'odometer_km' => $base3,
                'odometer_source' => FuelLog::ODOMETER_SOURCE_MANUAL,
                'station_name' => 'SPBU Pertamina Pringsewu',
                'receipt_number' => self::RECEIPT_PREFIX.'08',
                'is_full_tank' => true,
            ],
            [
                'vehicle' => $v3,
                'driver_id' => $d3 ?? $d1,
                'filled_at' => now()->subDays(18)->toDateString(),
                'liters' => 55,
                'cost' => 715000,
                'odometer_km' => $base3 + 120,
                'odometer_source' => FuelLog::ODOMETER_SOURCE_VEHICLE,
                'station_name' => 'SPBU Pertamina Pringsewu',
                'receipt_number' => self::RECEIPT_PREFIX.'09',
                'is_full_tank' => true,
                'notes' => 'Demo: low km/L vs expected',
            ],
            [
                'vehicle' => $v3,
                'driver_id' => $d1,
                'filled_at' => now()->subDays(3)->toDateString(),
                'liters' => 48,
                'cost' => 624000,
                'odometer_km' => $base3 + 520,
                'odometer_source' => FuelLog::ODOMETER_SOURCE_GPS,
                'station_name' => 'SPBU Shell Tanjung Karang',
                'receipt_number' => self::RECEIPT_PREFIX.'10',
                'is_full_tank' => true,
            ],
        ];
    }
}
