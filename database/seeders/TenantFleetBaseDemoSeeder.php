<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Schema;
use Modules\Fleet\Models\FleetBase;
use Modules\Fleet\Models\Vehicle;
use Modules\Fleet\Support\FleetBaseKind;

/**
 * Seeds sample fleet home bases (depot / yard / satellite) with PIC + coords.
 *
 *   php artisan tenants:seed --class=TenantFleetBaseDemoSeeder --tenants={id}
 */
class TenantFleetBaseDemoSeeder extends Seeder
{
    public const TAG = 'fleet-base-demo';

    public const CODE_PREFIX = 'FB-DEMO';

    public function run(): void
    {
        if (! class_exists(FleetBase::class) || ! Schema::hasTable('fleet_bases')) {
            $this->command?->warn('Fleet bases table missing. Install/migrate the fleet module first.');

            return;
        }

        $manager = $this->resolveManager();

        if ($manager === null) {
            $this->command?->warn('No users available to assign as fleet base manager (PIC).');

            return;
        }

        $created = 0;
        $updated = 0;
        $bases = [];

        foreach ($this->definitions() as $def) {
            $code = $def['code'];
            unset($def['code']);

            $base = FleetBase::query()->updateOrCreate(
                ['code' => $code],
                array_merge($def, ['manager_id' => $manager->id]),
            );

            $base->users()->syncWithoutDetaching([$manager->id]);

            if ($base->wasRecentlyCreated) {
                $created++;
            } else {
                $updated++;
            }

            $bases[] = $base;
        }

        $assignedVehicles = $this->assignDemoVehicles($bases);

        $this->command?->info(sprintf(
            'Fleet base demo ready: %d bases (%s-*). Created %d, updated %d. Vehicles assigned: %d. Manager: %s.',
            count($bases),
            self::CODE_PREFIX,
            $created,
            $updated,
            $assignedVehicles,
            $manager->email,
        ));
    }

    public function isInstalled(): bool
    {
        if (! class_exists(FleetBase::class) || ! Schema::hasTable('fleet_bases')) {
            return false;
        }

        return FleetBase::query()->where('notes', 'like', '%'.self::TAG.'%')->exists();
    }

    public function uninstall(): void
    {
        if (! class_exists(FleetBase::class) || ! Schema::hasTable('fleet_bases')) {
            return;
        }

        $baseIds = FleetBase::query()
            ->where('notes', 'like', '%'.self::TAG.'%')
            ->pluck('id');

        if ($baseIds->isEmpty()) {
            $this->command?->info('No fleet base demo data to remove.');

            return;
        }

        if (class_exists(Vehicle::class) && Schema::hasTable('vehicles') && Schema::hasColumn('vehicles', 'home_base_id')) {
            Vehicle::query()
                ->whereIn('home_base_id', $baseIds)
                ->update(['home_base_id' => null]);
        }

        $deleted = FleetBase::query()
            ->whereIn('id', $baseIds)
            ->delete();

        $this->command?->info("Fleet base demo data removed ({$deleted} bases).");
    }

    private function resolveManager(): ?User
    {
        $admin = User::query()
            ->whereHas('roles', fn ($query) => $query->where('slug', 'admin'))
            ->orderBy('id')
            ->first();

        if ($admin !== null) {
            return $admin;
        }

        return User::query()->orderBy('id')->first();
    }

    /**
     * @param  list<FleetBase>  $bases
     */
    private function assignDemoVehicles(array $bases): int
    {
        if (
            $bases === []
            || ! class_exists(Vehicle::class)
            || ! Schema::hasTable('vehicles')
            || ! Schema::hasColumn('vehicles', 'home_base_id')
        ) {
            return 0;
        }

        $vehicles = Vehicle::query()
            ->where('notes', 'like', '%'.TenantVehicleDemoSeeder::TAG.'%')
            ->orderBy('id')
            ->get(['id']);

        if ($vehicles->isEmpty()) {
            return 0;
        }

        $assigned = 0;
        $baseCount = count($bases);

        foreach ($vehicles as $index => $vehicle) {
            $base = $bases[$index % $baseCount];
            $vehicle->update(['home_base_id' => $base->id]);
            $assigned++;
        }

        return $assigned;
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function definitions(): array
    {
        $tag = self::TAG;

        return [
            [
                'code' => self::CODE_PREFIX.'-JKT',
                'name' => 'Depot Cakung Jakarta',
                'kind' => FleetBaseKind::Depot->value,
                'status' => FleetBase::STATUS_ACTIVE,
                'address' => 'Jl. Raya Cakung Cilincing No. 12, Cakung',
                'city' => 'Jakarta Timur',
                'province' => 'DKI Jakarta',
                'zip' => '13910',
                'latitude' => -6.1758,
                'longitude' => 106.9483,
                'phone' => '0215550101',
                'email' => 'depot.cakung@demo.local',
                'opens_at' => '07:00',
                'closes_at' => '21:00',
                'timezone' => 'Asia/Jakarta',
                'vehicle_capacity' => 48,
                'allows_overnight' => true,
                'service_radius_km' => 35,
                'notes' => "Primary rental & dispatch hub. [{$tag}]",
            ],
            [
                'code' => self::CODE_PREFIX.'-SBY',
                'name' => 'Depot Rungkut Surabaya',
                'kind' => FleetBaseKind::Depot->value,
                'status' => FleetBase::STATUS_ACTIVE,
                'address' => 'Jl. Rungkut Industri III No. 8',
                'city' => 'Surabaya',
                'province' => 'Jawa Timur',
                'zip' => '60293',
                'latitude' => -7.3294,
                'longitude' => 112.7689,
                'phone' => '0315550202',
                'email' => 'depot.rungkut@demo.local',
                'opens_at' => '07:30',
                'closes_at' => '20:00',
                'timezone' => 'Asia/Jakarta',
                'vehicle_capacity' => 36,
                'allows_overnight' => true,
                'service_radius_km' => 40,
                'notes' => "East Java operational base. [{$tag}]",
            ],
            [
                'code' => self::CODE_PREFIX.'-BDG',
                'name' => 'Yard Soekarno-Hatta Bandung',
                'kind' => FleetBaseKind::Yard->value,
                'status' => FleetBase::STATUS_ACTIVE,
                'address' => 'Jl. Soekarno-Hatta No. 220',
                'city' => 'Bandung',
                'province' => 'Jawa Barat',
                'zip' => '40286',
                'latitude' => -6.9478,
                'longitude' => 107.5972,
                'phone' => '0225550303',
                'email' => 'yard.bandung@demo.local',
                'opens_at' => '08:00',
                'closes_at' => '18:00',
                'timezone' => 'Asia/Jakarta',
                'vehicle_capacity' => 60,
                'allows_overnight' => true,
                'service_radius_km' => 25,
                'notes' => "Holding / overflow yard. [{$tag}]",
            ],
            [
                'code' => self::CODE_PREFIX.'-DPS',
                'name' => 'Satellite Tuban Bali',
                'kind' => FleetBaseKind::Satellite->value,
                'status' => FleetBase::STATUS_ACTIVE,
                'address' => 'Jl. Raya Tuban Bypass Ngurah Rai',
                'city' => 'Badung',
                'province' => 'Bali',
                'zip' => '80361',
                'latitude' => -8.7456,
                'longitude' => 115.1672,
                'phone' => '03615550404',
                'email' => 'satellite.bali@demo.local',
                'opens_at' => '08:00',
                'closes_at' => '19:00',
                'timezone' => 'Asia/Makassar',
                'vehicle_capacity' => 18,
                'allows_overnight' => true,
                'service_radius_km' => 30,
                'notes' => "Airport-side satellite for tourist rentals. [{$tag}]",
            ],
            [
                'code' => self::CODE_PREFIX.'-MDN',
                'name' => 'Workshop Base Polonia Medan',
                'kind' => FleetBaseKind::WorkshopBase->value,
                'status' => FleetBase::STATUS_ACTIVE,
                'address' => 'Jl. Gatot Subroto No. 305',
                'city' => 'Medan',
                'province' => 'Sumatera Utara',
                'zip' => '20112',
                'latitude' => 3.5689,
                'longitude' => 98.6711,
                'phone' => '0615550505',
                'email' => 'workshop.medan@demo.local',
                'opens_at' => '08:00',
                'closes_at' => '17:00',
                'timezone' => 'Asia/Jakarta',
                'vehicle_capacity' => 12,
                'allows_overnight' => false,
                'service_radius_km' => 15,
                'notes' => "Maintenance staging base near workshop. [{$tag}]",
            ],
        ];
    }
}
