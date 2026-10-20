<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Schema;
use Modules\Fleet\Models\FleetBase;
use Modules\Fleet\Models\Vehicle;
use Modules\Fleet\Models\VehicleSettlement;
use Modules\Fleet\Support\VehicleRentalClass;
use Modules\Partners\Models\Partner;

/**
 * Seeds 30 demo rental vehicles (minibus, MPV, SUV) with color, seats,
 * rental classes, base assignments, compliance/insurance, and investor schemes.
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

        $baseIds = $this->resolveBaseIds();
        $partnerIds = $this->resolvePartnerIds();

        $created = 0;
        $updated = 0;

        foreach ($this->definitions($baseIds, $partnerIds) as $def) {
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

        $this->seedDemoSettlements();

        $this->command?->info(sprintf(
            'Vehicle demo ready: 30 plates (%s ##). Created %d, updated %d. Total fleet now %d.',
            self::PLATE_PREFIX,
            $created,
            $updated,
            Vehicle::query()->count(),
        ));
    }

    public function isInstalled(): bool
    {
        if (! class_exists(Vehicle::class) || ! Schema::hasTable('vehicles')) {
            return false;
        }

        return Vehicle::query()->where('notes', 'like', '%'.self::TAG.'%')->exists();
    }

    public function uninstall(): void
    {
        if (! class_exists(Vehicle::class) || ! Schema::hasTable('vehicles')) {
            return;
        }

        $vehicleIds = Vehicle::query()
            ->where('notes', 'like', '%'.self::TAG.'%')
            ->pluck('id');

        if (class_exists(VehicleSettlement::class) && Schema::hasTable('vehicle_settlements')) {
            VehicleSettlement::query()
                ->whereIn('vehicle_id', $vehicleIds)
                ->orWhere('notes', 'like', '%'.self::TAG.'%')
                ->delete();
        }

        if (Schema::hasTable('vehicle_compliance_renewals')) {
            \Illuminate\Support\Facades\DB::table('vehicle_compliance_renewals')
                ->whereIn('vehicle_id', $vehicleIds)
                ->delete();
        }

        $deleted = Vehicle::query()
            ->whereIn('id', $vehicleIds)
            ->delete();

        $this->command?->info("Vehicle demo data removed ({$deleted} vehicles).");
    }

    /**
     * @return list<int>
     */
    private function resolveBaseIds(): array
    {
        if (! class_exists(FleetBase::class) || ! Schema::hasTable('fleet_bases')) {
            return [];
        }

        return FleetBase::query()
            ->where('status', FleetBase::STATUS_ACTIVE)
            ->orderBy('id')
            ->pluck('id')
            ->all();
    }

    /**
     * @return list<int>
     */
    private function resolvePartnerIds(): array
    {
        if (! class_exists(Partner::class) || ! Schema::hasTable('partners')) {
            return [];
        }

        return Partner::query()
            ->where('supplier_rank', '>', 0)
            ->orWhere('customer_rank', '>', 0)
            ->orderBy('id')
            ->pluck('id')
            ->all();
    }

    /**
     * Seeds sample investor settlement statements for investor demo vehicles.
     */
    private function seedDemoSettlements(): void
    {
        if (! class_exists(VehicleSettlement::class) || ! Schema::hasTable('vehicle_settlements')) {
            return;
        }

        $investorVehicles = Vehicle::query()
            ->where('notes', 'like', '%'.self::TAG.'%')
            ->where('ownership_type', 'investor_revenue_share')
            ->whereNotNull('partner_id')
            ->take(2)
            ->get();

        if ($investorVehicles->isEmpty()) {
            return;
        }

        $period = now()->subMonth()->format('Y-m');

        foreach ($investorVehicles as $index => $vehicle) {
            $code = sprintf('SETT-%s-%04d', str_replace('-', '', $period), $vehicle->id);

            VehicleSettlement::query()->updateOrCreate(
                ['code' => $code],
                [
                    'vehicle_id' => $vehicle->id,
                    'partner_id' => $vehicle->partner_id,
                    'period_month' => $period,
                    'start_date' => now()->subMonth()->startOfMonth()->toDateString(),
                    'end_date' => now()->subMonth()->endOfMonth()->toDateString(),
                    'ownership_type' => 'investor_revenue_share',
                    'settlement_scheme' => 'revenue_share',
                    'revenue_share_owner_pct' => $vehicle->revenue_share_owner_pct ?? 70.00,
                    'revenue_share_tenant_pct' => $vehicle->revenue_share_tenant_pct ?? 30.00,
                    'total_orders' => 4 + $index,
                    'total_rental_days' => 18 + ($index * 2),
                    'total_revenue' => 9500000.00 + ($index * 1200000.00),
                    'owner_gross_share' => 6650000.00 + ($index * 840000.00),
                    'tenant_gross_share' => 2850000.00 + ($index * 360000.00),
                    'total_maintenance_cost' => 450000.00,
                    'maintenance_deduction' => 0.00,
                    'net_payout' => 6650000.00 + ($index * 840000.00),
                    'status' => $index === 0 ? VehicleSettlement::STATUS_APPROVED : VehicleSettlement::STATUS_DRAFT,
                    'payment_method' => 'bank_transfer',
                    'bank_name' => 'BCA',
                    'bank_account_number' => '0352991823',
                    'bank_account_holder' => 'Investor Mitra Demo',
                    'notes' => 'Bagi hasil sewa periode '.$period.' ['.self::TAG.']',
                ]
            );
        }
    }

    /**
     * @param  list<int>  $baseIds
     * @param  list<int>  $partnerIds
     * @return list<array<string, mixed>>
     */
    private function definitions(array $baseIds = [], array $partnerIds = []): array
    {
        $templates = [
            [
                'name' => 'Toyota Avanza 1.3 G',
                'type' => 'car',
                'brand' => 'Toyota',
                'capacity_kg' => 500,
                'capacity_seats' => 7,
                'rental_class' => VehicleRentalClass::MPV,
                'color' => 'Silver Metalik',
                'cost_per_km' => 1400,
                'fuel_type' => 'petrol',
                'tank_capacity_liters' => 43,
                'expected_km_per_liter' => 13.5,
            ],
            [
                'name' => 'Toyota Veloz 1.5 Q CVT',
                'type' => 'car',
                'brand' => 'Toyota',
                'capacity_kg' => 500,
                'capacity_seats' => 7,
                'rental_class' => VehicleRentalClass::MPV,
                'color' => 'Putih Mutiara',
                'cost_per_km' => 1500,
                'fuel_type' => 'petrol',
                'tank_capacity_liters' => 43,
                'expected_km_per_liter' => 13.0,
            ],
            [
                'name' => 'Mitsubishi Xpander Ultimate',
                'type' => 'car',
                'brand' => 'Mitsubishi',
                'capacity_kg' => 520,
                'capacity_seats' => 7,
                'rental_class' => VehicleRentalClass::MPV,
                'color' => 'Hitam Mika',
                'cost_per_km' => 1600,
                'fuel_type' => 'petrol',
                'tank_capacity_liters' => 45,
                'expected_km_per_liter' => 12.5,
            ],
            [
                'name' => 'Toyota Innova Reborn 2.4 G AT',
                'type' => 'car',
                'brand' => 'Toyota',
                'capacity_kg' => 650,
                'capacity_seats' => 7,
                'rental_class' => VehicleRentalClass::MPV,
                'color' => 'Abu-abu Metalik',
                'cost_per_km' => 1800,
                'fuel_type' => 'diesel',
                'tank_capacity_liters' => 55,
                'expected_km_per_liter' => 12.0,
            ],
            [
                'name' => 'Toyota Innova Zenix 2.0 V Hybrid',
                'type' => 'car',
                'brand' => 'Toyota',
                'capacity_kg' => 650,
                'capacity_seats' => 7,
                'rental_class' => VehicleRentalClass::MPV,
                'color' => 'Putih Mutiara',
                'cost_per_km' => 1600,
                'fuel_type' => 'petrol',
                'tank_capacity_liters' => 52,
                'expected_km_per_liter' => 16.0,
            ],
            [
                'name' => 'Suzuki Ertiga Hybrid GX',
                'type' => 'car',
                'brand' => 'Suzuki',
                'capacity_kg' => 500,
                'capacity_seats' => 7,
                'rental_class' => VehicleRentalClass::MPV,
                'color' => 'Burgundy Red',
                'cost_per_km' => 1350,
                'fuel_type' => 'petrol',
                'tank_capacity_liters' => 45,
                'expected_km_per_liter' => 14.5,
            ],
            [
                'name' => 'Toyota Fortuner 2.8 VRZ 4x2',
                'type' => 'car',
                'brand' => 'Toyota',
                'capacity_kg' => 700,
                'capacity_seats' => 7,
                'rental_class' => VehicleRentalClass::SUV,
                'color' => 'Hitam Metalik',
                'cost_per_km' => 2400,
                'fuel_type' => 'diesel',
                'tank_capacity_liters' => 80,
                'expected_km_per_liter' => 10.5,
            ],
            [
                'name' => 'Mitsubishi Pajero Sport Dakar 4x2',
                'type' => 'car',
                'brand' => 'Mitsubishi',
                'capacity_kg' => 700,
                'capacity_seats' => 7,
                'rental_class' => VehicleRentalClass::SUV,
                'color' => 'Putih Mutiara',
                'cost_per_km' => 2400,
                'fuel_type' => 'diesel',
                'tank_capacity_liters' => 68,
                'expected_km_per_liter' => 10.8,
            ],
            [
                'name' => 'Honda CR-V 1.5 Turbo RS',
                'type' => 'car',
                'brand' => 'Honda',
                'capacity_kg' => 600,
                'capacity_seats' => 7,
                'rental_class' => VehicleRentalClass::SUV,
                'color' => 'Crystal Black',
                'cost_per_km' => 2000,
                'fuel_type' => 'petrol',
                'tank_capacity_liters' => 53,
                'expected_km_per_liter' => 11.5,
            ],
            [
                'name' => 'Toyota Rush 1.5 S GR Sport',
                'type' => 'car',
                'brand' => 'Toyota',
                'capacity_kg' => 550,
                'capacity_seats' => 7,
                'rental_class' => VehicleRentalClass::SUV,
                'color' => 'Dark Red Mica',
                'cost_per_km' => 1500,
                'fuel_type' => 'petrol',
                'tank_capacity_liters' => 45,
                'expected_km_per_liter' => 12.8,
            ],
            [
                'name' => 'Toyota HiAce Commuter Minibus',
                'type' => 'van',
                'brand' => 'Toyota',
                'capacity_kg' => 1300,
                'capacity_seats' => 15,
                'rental_class' => VehicleRentalClass::VAN,
                'color' => 'Silver Metalik',
                'cost_per_km' => 2500,
                'fuel_type' => 'diesel',
                'tank_capacity_liters' => 70,
                'expected_km_per_liter' => 9.5,
            ],
            [
                'name' => 'Toyota HiAce Premio Minibus',
                'type' => 'van',
                'brand' => 'Toyota',
                'capacity_kg' => 1200,
                'capacity_seats' => 12,
                'rental_class' => VehicleRentalClass::VAN,
                'color' => 'Putih',
                'cost_per_km' => 2700,
                'fuel_type' => 'diesel',
                'tank_capacity_liters' => 70,
                'expected_km_per_liter' => 9.0,
            ],
            [
                'name' => 'Isuzu Elf Microbus',
                'type' => 'van',
                'brand' => 'Isuzu',
                'capacity_kg' => 1500,
                'capacity_seats' => 16,
                'rental_class' => VehicleRentalClass::VAN,
                'color' => 'Putih Silver',
                'cost_per_km' => 2800,
                'fuel_type' => 'diesel',
                'tank_capacity_liters' => 75,
                'expected_km_per_liter' => 8.5,
            ],
            [
                'name' => 'Toyota Alphard 2.5 G Executive',
                'type' => 'car',
                'brand' => 'Toyota',
                'capacity_kg' => 600,
                'capacity_seats' => 7,
                'rental_class' => VehicleRentalClass::PREMIUM,
                'color' => 'Hitam Metalik',
                'cost_per_km' => 3000,
                'fuel_type' => 'petrol',
                'tank_capacity_liters' => 75,
                'expected_km_per_liter' => 9.5,
            ],
            [
                'name' => 'Hyundai Stargazer Prime',
                'type' => 'car',
                'brand' => 'Hyundai',
                'capacity_kg' => 500,
                'capacity_seats' => 7,
                'rental_class' => VehicleRentalClass::MPV,
                'color' => 'Magnetic Silver',
                'cost_per_km' => 1450,
                'fuel_type' => 'petrol',
                'tank_capacity_liters' => 40,
                'expected_km_per_liter' => 13.5,
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

        $insuranceProviders = [
            'Asuransi Astra (Garda Oto)',
            'Asuransi Sinarmas',
            'Asuransi ACA',
            'Asuransi Jasindo',
        ];

        $defs = [];
        $baseCount = count($baseIds);
        $partnerCount = count($partnerIds);

        for ($i = 1; $i <= 30; $i++) {
            $template = $templates[($i - 1) % count($templates)];
            $capacityKg = (int) $template['capacity_kg'];
            $year = 2017 + (($i - 1) % 8);
            $status = $statuses[$i] ?? Vehicle::STATUS_ACTIVE;

            $homeBaseId = $baseCount > 0 ? $baseIds[($i - 1) % $baseCount] : null;

            // Determine ownership and financial scheme
            if ($i <= 20) {
                $ownershipType = 'owned';
                $partnerId = null;
                $contractNumber = null;
                $contractStart = null;
                $contractEnd = null;
                $scheme = null;
                $ownerPct = null;
                $tenantPct = null;
                $fixedFee = null;
            } elseif ($i <= 26) {
                $ownershipType = 'investor_revenue_share';
                $partnerId = $partnerCount > 0 ? $partnerIds[($i - 21) % $partnerCount] : null;
                $contractNumber = sprintf('CTR/REV/2026/%03d', $i);
                $contractStart = now()->subMonths(6)->toDateString();
                $contractEnd = now()->addMonths(18)->toDateString();
                $scheme = 'revenue_share';
                $ownerPct = 70.00;
                $tenantPct = 30.00;
                $fixedFee = null;
            } else {
                $ownershipType = 'investor_fixed_rent';
                $partnerId = $partnerCount > 0 ? $partnerIds[($i - 27) % $partnerCount] : null;
                $contractNumber = sprintf('CTR/FIX/2026/%03d', $i);
                $contractStart = now()->subMonths(3)->toDateString();
                $contractEnd = now()->addMonths(9)->toDateString();
                $scheme = 'fixed_fee';
                $ownerPct = null;
                $tenantPct = null;
                $fixedFee = 5500000.00;
            }

            $provider = $insuranceProviders[($i - 1) % count($insuranceProviders)];

            $defs[] = [
                'plate_number' => sprintf('%s %02d', self::PLATE_PREFIX, $i),
                'name' => sprintf('%s #%02d', $template['name'], $i),
                'type' => $template['type'],
                'rental_class' => $template['rental_class'],
                'brand' => $template['brand'],
                'model_year' => $year,
                'color' => $template['color'],
                'capacity' => $capacityKg.' kg',
                'capacity_kg' => $capacityKg,
                'capacity_seats' => $template['capacity_seats'],
                'cost_per_km' => $template['cost_per_km'],
                'tank_capacity_liters' => $template['tank_capacity_liters'],
                'expected_km_per_liter' => $template['expected_km_per_liter'],
                'fuel_type' => $template['fuel_type'],
                'status' => $status,
                'home_base_id' => $homeBaseId,
                'ownership_type' => $ownershipType,
                'partner_id' => $partnerId,
                'contract_number' => $contractNumber,
                'contract_start_date' => $contractStart,
                'contract_end_date' => $contractEnd,
                'settlement_scheme' => $scheme,
                'revenue_share_owner_pct' => $ownerPct,
                'revenue_share_tenant_pct' => $tenantPct,
                'fixed_fee_amount' => $fixedFee,
                'maintenance_payer' => 'tenant',
                'odometer_km' => 8000 + ($i * 1370),
                'stnk_expires_at' => now()->addMonths(6 + ($i % 12))->toDateString(),
                'stnk_five_year_expires_at' => now()->addYears(3)->addMonths($i % 12)->toDateString(),
                'insurance_provider' => $provider,
                'insurance_policy_number' => sprintf('POL-%s-2026-%04d', substr($provider, 0, 5), $i),
                'insurance_type' => $i % 3 === 0 ? 'tlo' : 'all_risk',
                'insurance_expires_at' => now()->addMonths(3 + ($i % 10))->toDateString(),
                'kir_expires_at' => now()->addMonths(3 + ($i % 10))->toDateString(),
                'notes' => 'Demo fleet seed ['.self::TAG.']',
            ];
        }

        return $defs;
    }
}
