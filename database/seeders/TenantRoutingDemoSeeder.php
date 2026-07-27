<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Schema;
use Modules\Fleet\Models\Driver;
use Modules\Fleet\Models\Vehicle;
use Modules\Orders\Models\DeliveryOrder;
use Modules\Partners\Models\Partner;
use Modules\Routing\Models\RoutePlan;

/**
 * Seeds fleet + confirmed geocoded delivery orders + 30 demo route plans for Routing.
 *
 * Prerequisites the Create Plan UI needs:
 * - active vehicles with capacity_kg, cost_per_km, valid STNK/KIR
 * - available drivers with valid SIM
 * - confirmed DOs on the planned date with delivery_lat/lng + demand_kg
 *
 *   php artisan tenants:seed --class=TenantRoutingDemoSeeder --tenants={id}
 */
class TenantRoutingDemoSeeder extends Seeder
{
    public const TAG = '[ROUTING-DEMO]';

    public const PLAN_COUNT = 30;

    public function run(): void
    {
        if (! class_exists(DeliveryOrder::class) || ! Schema::hasTable('delivery_orders')) {
            $this->command?->warn('Orders tables missing. Install the orders module first.');

            return;
        }

        if (! class_exists(Vehicle::class) || ! Schema::hasTable('vehicles') || ! Schema::hasTable('drivers')) {
            $this->command?->warn('Fleet tables missing. Install the fleet module first.');

            return;
        }

        $plannedDate = now()->toDateString();
        $partners = $this->resolvePartners();
        $vehicles = $this->ensureRoutingVehicles();
        $drivers = $this->ensureRoutingDrivers();

        if (DeliveryOrder::query()->where('notes', 'like', '%'.self::TAG.'%')->exists()) {
            $this->command?->info('Routing demo orders already present — refreshing fleet readiness only.');
        } else {
            $this->seedDeliveryOrders($partners, $plannedDate);
        }

        if (class_exists(RoutePlan::class) && Schema::hasTable('route_plans')) {
            if ($this->demoPlansExist()) {
                $this->command?->info('Routing demo plans already present — skipping create.');
            } else {
                $this->seedRoutePlans();
            }
        } else {
            $this->command?->warn('Routing tables missing. Install the routing module first.');
        }

        $eligibleOrders = DeliveryOrder::query()
            ->where('status', DeliveryOrder::STATUS_CONFIRMED)
            ->whereDate('order_date', $plannedDate)
            ->whereNotNull('delivery_lat')
            ->whereNotNull('delivery_lng')
            ->count();

        $planCount = class_exists(RoutePlan::class) && Schema::hasTable('route_plans')
            ? RoutePlan::query()->where('params->demo_tag', self::TAG)->count()
            : 0;

        $this->command?->info(sprintf(
            'Routing demo ready for %s: %d vehicles, %d drivers, %d confirmed geocoded DOs, %d route plans.',
            $plannedDate,
            $vehicles->count(),
            $drivers->count(),
            $eligibleOrders,
            $planCount,
        ));
        $this->command?->info('Open /module/routing/plans');
    }

    protected function demoPlansExist(): bool
    {
        return RoutePlan::query()->where('params->demo_tag', self::TAG)->count() >= self::PLAN_COUNT;
    }

    protected function seedRoutePlans(): void
    {
        $statuses = [
            RoutePlan::STATUS_DRAFT,
            RoutePlan::STATUS_OPTIMIZED,
            RoutePlan::STATUS_APPLIED,
            RoutePlan::STATUS_CANCELLED,
        ];
        $objectives = [
            RoutePlan::OBJECTIVE_FUEL_COST,
            RoutePlan::OBJECTIVE_DISTANCE,
        ];

        $existing = RoutePlan::query()->where('params->demo_tag', self::TAG)->count();

        for ($i = $existing + 1; $i <= self::PLAN_COUNT; $i++) {
            $status = $statuses[($i - 1) % count($statuses)];
            $objective = $objectives[($i - 1) % count($objectives)];
            $distance = round(40 + ($i * 7.35), 2);
            $cost = round($distance * (2000 + ($i % 5) * 250), 2);

            RoutePlan::query()->create([
                'code' => sprintf('RP-DEMO-%04d', $i),
                'status' => $status,
                'objective' => $objective,
                'planned_date' => now()->subDays(($i - 1) % 14)->toDateString(),
                'depot_address' => 'Gudang Pusat — Jl. Medan Merdeka Selatan, Jakarta Pusat',
                'depot_lat' => -6.2088000,
                'depot_lng' => 106.8456000,
                'params' => [
                    'demo_tag' => self::TAG,
                    'delivery_order_ids' => null,
                ],
                'total_distance_km' => in_array($status, [RoutePlan::STATUS_DRAFT, RoutePlan::STATUS_CANCELLED], true) ? 0 : $distance,
                'total_cost' => in_array($status, [RoutePlan::STATUS_DRAFT, RoutePlan::STATUS_CANCELLED], true) ? 0 : $cost,
                'unassigned_count' => $status === RoutePlan::STATUS_OPTIMIZED && $i % 3 === 0 ? ($i % 4) + 1 : 0,
                'optimized_at' => in_array($status, [RoutePlan::STATUS_OPTIMIZED, RoutePlan::STATUS_APPLIED], true)
                    ? now()->subDays(($i - 1) % 10)
                    : null,
                'applied_at' => $status === RoutePlan::STATUS_APPLIED
                    ? now()->subDays(($i - 1) % 7)
                    : null,
            ]);
        }

        $this->command?->info(sprintf('Created %d demo route plans.', self::PLAN_COUNT - $existing));
    }

    /**
     * @return \Illuminate\Support\Collection<int, Partner>
     */
    protected function resolvePartners()
    {
        $partners = Partner::query()
            ->where('customer_rank', '>', 0)
            ->orderBy('id')
            ->limit(8)
            ->get();

        if ($partners->isNotEmpty()) {
            return $partners;
        }

        $this->command?->info('No customer partners — creating routing demo partners.');

        foreach ([
            ['code' => 'PART-RT-001', 'name' => 'Toko Routing Menteng'],
            ['code' => 'PART-RT-002', 'name' => 'CV Routing Kelapa Gading'],
            ['code' => 'PART-RT-003', 'name' => 'UD Routing Kebayoran'],
            ['code' => 'PART-RT-004', 'name' => 'PT Routing Bekasi Retail'],
        ] as $row) {
            Partner::query()->firstOrCreate(
                ['code' => $row['code']],
                [
                    'name' => $row['name'],
                    'customer_rank' => 1,
                    'supplier_rank' => 0,
                    'status' => 'active',
                ],
            );
        }

        return Partner::query()->where('code', 'like', 'PART-RT-%')->orderBy('id')->get();
    }

    /**
     * @return \Illuminate\Support\Collection<int, Vehicle>
     */
    protected function ensureRoutingVehicles()
    {
        $defs = [
            [
                'plate_number' => 'BE RT 01',
                'name' => 'Routing Truck Hemat',
                'type' => 'truck',
                'brand' => 'Hino',
                'capacity_kg' => 5000,
                'cost_per_km' => 2500,
            ],
            [
                'plate_number' => 'BE RT 02',
                'name' => 'Routing Truck Premium',
                'type' => 'truck',
                'brand' => 'Mitsubishi',
                'capacity_kg' => 5000,
                'cost_per_km' => 8000,
            ],
            [
                'plate_number' => 'BE RT 03',
                'name' => 'Routing Box Medium',
                'type' => 'truck',
                'brand' => 'Isuzu',
                'capacity_kg' => 2000,
                'cost_per_km' => 4000,
            ],
            [
                'plate_number' => 'BE RT 04',
                'name' => 'Routing Van Ringan',
                'type' => 'van',
                'brand' => 'Suzuki',
                'capacity_kg' => 800,
                'cost_per_km' => 1500,
            ],
        ];

        foreach ($defs as $def) {
            $vehicle = Vehicle::query()->firstOrCreate(
                ['plate_number' => $def['plate_number']],
                [
                    'name' => $def['name'],
                    'type' => $def['type'],
                    'brand' => $def['brand'],
                    'model_year' => 2022,
                    'capacity' => $def['capacity_kg'].' kg',
                    'status' => Vehicle::STATUS_ACTIVE,
                    'capacity_kg' => $def['capacity_kg'],
                    'cost_per_km' => $def['cost_per_km'],
                    'fuel_type' => 'diesel',
                    'tank_capacity_liters' => 120,
                    'expected_km_per_liter' => 6,
                    'odometer_km' => 25000,
                    'stnk_expires_at' => now()->addYear(),
                    'kir_expires_at' => now()->addMonths(10),
                ],
            );

            $vehicle->forceFill([
                'status' => Vehicle::STATUS_ACTIVE,
                'capacity_kg' => $def['capacity_kg'],
                'cost_per_km' => $def['cost_per_km'],
                'stnk_expires_at' => now()->addYear(),
                'kir_expires_at' => now()->addMonths(10),
            ])->save();
        }

        // Also patch existing active fleet so fuel_cost objective has cost data.
        Vehicle::query()
            ->where('status', Vehicle::STATUS_ACTIVE)
            ->whereNull('cost_per_km')
            ->each(function (Vehicle $vehicle): void {
                $vehicle->forceFill([
                    'cost_per_km' => match (true) {
                        (float) $vehicle->capacity_kg >= 5000 => 3500,
                        (float) $vehicle->capacity_kg >= 2000 => 3000,
                        default => 2000,
                    },
                    'stnk_expires_at' => $vehicle->stnk_expires_at && $vehicle->stnk_expires_at->isFuture()
                        ? $vehicle->stnk_expires_at
                        : now()->addYear(),
                    'kir_expires_at' => $vehicle->kir_expires_at && $vehicle->kir_expires_at->isFuture()
                        ? $vehicle->kir_expires_at
                        : now()->addMonths(10),
                ])->save();
            });

        return Vehicle::query()
            ->where('status', Vehicle::STATUS_ACTIVE)
            ->whereNotNull('capacity_kg')
            ->whereNotNull('cost_per_km')
            ->orderBy('id')
            ->get();
    }

    /**
     * @return \Illuminate\Support\Collection<int, Driver>
     */
    protected function ensureRoutingDrivers()
    {
        $names = [
            'Sopir Routing Satu',
            'Sopir Routing Dua',
            'Sopir Routing Tiga',
            'Sopir Routing Empat',
        ];

        foreach ($names as $index => $name) {
            Driver::query()->firstOrCreate(
                ['name' => $name],
                [
                    'phone' => '08139990'.str_pad((string) ($index + 1), 2, '0', STR_PAD_LEFT),
                    'license_number' => 'SIM-RT-'.str_pad((string) ($index + 1), 3, '0', STR_PAD_LEFT),
                    'license_type' => 'B2',
                    'license_expires_at' => now()->addYears(2),
                    'status' => Driver::STATUS_AVAILABLE,
                ],
            );
        }

        Driver::query()
            ->where('status', Driver::STATUS_AVAILABLE)
            ->where(function ($q): void {
                $q->whereNull('license_expires_at')
                    ->orWhereDate('license_expires_at', '<', now()->toDateString());
            })
            ->update(['license_expires_at' => now()->addYears(2)]);

        return Driver::query()
            ->where('status', Driver::STATUS_AVAILABLE)
            ->orderBy('id')
            ->get();
    }

    /**
     * @param  \Illuminate\Support\Collection<int, Partner>  $partners
     */
    protected function seedDeliveryOrders($partners, string $plannedDate): void
    {
        // Stops clustered around Jakarta (matches Routing Create default depot).
        $stops = [
            ['address' => 'Jl. Menteng Raya No. 12, Jakarta Pusat', 'lat' => -6.1944, 'lng' => 106.8294, 'demand' => 180],
            ['address' => 'Jl. Thamrin No. 5, Jakarta Pusat', 'lat' => -6.1951, 'lng' => 106.8230, 'demand' => 220],
            ['address' => 'Jl. Boulevard Barat Raya, Kelapa Gading', 'lat' => -6.1574, 'lng' => 106.9090, 'demand' => 350],
            ['address' => 'Jl. Boulevard Timur, Kelapa Gading', 'lat' => -6.1610, 'lng' => 106.9155, 'demand' => 280],
            ['address' => 'Jl. Fatmawati No. 40, Jakarta Selatan', 'lat' => -6.2735, 'lng' => 106.7972, 'demand' => 400],
            ['address' => 'Jl. TB Simatupang Kav. 10, Jakarta Selatan', 'lat' => -6.2910, 'lng' => 106.8205, 'demand' => 320],
            ['address' => 'Jl. Ahmad Yani, Bekasi Barat', 'lat' => -6.2383, 'lng' => 106.9756, 'demand' => 450],
            ['address' => 'Jl. Cut Mutia, Bekasi Timur', 'lat' => -6.2450, 'lng' => 107.0020, 'demand' => 380],
            ['address' => 'Jl. Gajah Mada, Tangerang', 'lat' => -6.1783, 'lng' => 106.6319, 'demand' => 260],
            ['address' => 'Jl. Imam Bonjol, Tangerang', 'lat' => -6.1905, 'lng' => 106.6402, 'demand' => 210],
            ['address' => 'Jl. Raya Serpong, Tangerang Selatan', 'lat' => -6.3021, 'lng' => 106.6648, 'demand' => 300],
            ['address' => 'Jl. Boulevard BSD, Tangerang Selatan', 'lat' => -6.3015, 'lng' => 106.6520, 'demand' => 240],
        ];

        $nextCode = $this->nextDeliveryOrderCode();

        foreach ($stops as $index => $stop) {
            /** @var Partner $partner */
            $partner = $partners[$index % $partners->count()];

            DeliveryOrder::query()->create([
                'code' => sprintf('DO-RT-%06d', $nextCode++),
                'partner_id' => $partner->id,
                'status' => DeliveryOrder::STATUS_CONFIRMED,
                'order_date' => $plannedDate,
                'pickup_address' => 'Gudang Pusat — Jl. Medan Merdeka Selatan, Jakarta Pusat',
                'delivery_address' => $stop['address'],
                'delivery_lat' => $stop['lat'],
                'delivery_lng' => $stop['lng'],
                'demand_kg' => $stop['demand'],
                'notes' => self::TAG.' Stop #'.($index + 1),
                'confirmed_at' => now(),
            ]);
        }

        $this->command?->info(sprintf('Created %d confirmed geocoded delivery orders for %s.', count($stops), $plannedDate));
    }

    protected function nextDeliveryOrderCode(): int
    {
        $latest = DeliveryOrder::query()
            ->where('code', 'like', 'DO-RT-%')
            ->orderByDesc('code')
            ->value('code');

        if ($latest && preg_match('/DO-RT-(\d+)/', $latest, $matches) === 1) {
            return ((int) $matches[1]) + 1;
        }

        return 1;
    }
}
