<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Seeder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Schema;
use Modules\Document\Models\Document;
use Modules\Document\Models\DocumentType;
use Modules\Fleet\Models\Driver;
use Modules\Fleet\Models\Vehicle;

/**
 * Seeds 5 demo vehicles + 5 demo drivers, each with compliance documents.
 *
 *   php artisan tenants:seed --class=TenantFleetDocumentDemoSeeder --tenants={id}
 */
class TenantFleetDocumentDemoSeeder extends Seeder
{
    public function run(): void
    {
        if (! class_exists(Vehicle::class) || ! Schema::hasTable('vehicles') || ! Schema::hasTable('drivers')) {
            $this->command?->warn('Fleet tables missing. Install the fleet module first.');

            return;
        }

        if (! class_exists(Document::class) || ! Schema::hasTable('documents') || ! Schema::hasTable('document_types')) {
            $this->command?->warn('Document tables missing. Install the document module first.');

            return;
        }

        $userId = User::query()->value('id');

        if (! $userId) {
            $this->command?->warn('No users found in this tenant.');

            return;
        }

        $vehicleTypes = DocumentType::query()
            ->where('entity_type', DocumentType::ENTITY_VEHICLE)
            ->orderBy('sort_order')
            ->get()
            ->keyBy('key');

        $driverTypes = DocumentType::query()
            ->where('entity_type', DocumentType::ENTITY_DRIVER)
            ->orderBy('sort_order')
            ->get()
            ->keyBy('key');

        if ($vehicleTypes->isEmpty() || $driverTypes->isEmpty()) {
            $this->command?->warn('Document types not found. Run document module migrations first.');

            return;
        }

        $vehicles = $this->seedVehicles();
        $drivers = $this->seedDrivers();

        $this->seedVehicleDocuments($vehicles, $vehicleTypes, (int) $userId);
        $this->seedDriverDocuments($drivers, $driverTypes, (int) $userId);

        $this->command?->info(sprintf(
            'Fleet+Document demo ready: %d vehicles, %d drivers, %d documents.',
            Vehicle::query()->count(),
            Driver::query()->count(),
            Document::query()->count(),
        ));
    }

    /**
     * @return list<Vehicle>
     */
    protected function seedVehicles(): array
    {
        $defs = [
            [
                'plate_number' => 'BE 1001 MM',
                'name' => 'Truk Hino 500 #01',
                'type' => 'truck',
                'brand' => 'Hino',
                'model_year' => 2020,
                'capacity' => '8000 kg',
                'capacity_kg' => 8000,
                'fuel_type' => 'diesel',
                'status' => Vehicle::STATUS_ACTIVE,
            ],
            [
                'plate_number' => 'BE 1002 MM',
                'name' => 'Truk Isuzu Elf #02',
                'type' => 'truck',
                'brand' => 'Isuzu',
                'model_year' => 2019,
                'capacity' => '4000 kg',
                'capacity_kg' => 4000,
                'fuel_type' => 'diesel',
                'status' => Vehicle::STATUS_ACTIVE,
            ],
            [
                'plate_number' => 'BE 1003 MM',
                'name' => 'Van Mitsubishi L300 #03',
                'type' => 'van',
                'brand' => 'Mitsubishi',
                'model_year' => 2021,
                'capacity' => '1200 kg',
                'capacity_kg' => 1200,
                'fuel_type' => 'petrol',
                'status' => Vehicle::STATUS_ACTIVE,
            ],
            [
                'plate_number' => 'BE 1004 MM',
                'name' => 'Mobil Box Daihatsu #04',
                'type' => 'van',
                'brand' => 'Daihatsu',
                'model_year' => 2018,
                'capacity' => '1500 kg',
                'capacity_kg' => 1500,
                'fuel_type' => 'petrol',
                'status' => Vehicle::STATUS_ACTIVE,
            ],
            [
                'plate_number' => 'BE 1005 MM',
                'name' => 'Pickup Toyota Hilux #05',
                'type' => 'truck',
                'brand' => 'Toyota',
                'model_year' => 2022,
                'capacity' => '1000 kg',
                'capacity_kg' => 1000,
                'fuel_type' => 'diesel',
                'status' => Vehicle::STATUS_ACTIVE,
            ],
        ];

        $vehicles = [];

        foreach ($defs as $def) {
            $plate = $def['plate_number'];
            unset($def['plate_number']);

            $vehicles[] = Vehicle::query()->updateOrCreate(
                ['plate_number' => $plate],
                $def,
            );
        }

        return $vehicles;
    }

    /**
     * @return list<Driver>
     */
    protected function seedDrivers(): array
    {
        $defs = [
            [
                'license_number' => 'SIM-B2-DEMO-001',
                'name' => 'Agus Setiawan',
                'license_type' => 'B2',
                'license_expires_at' => now()->subDays(45)->toDateString(),
                'phone' => '081234567801',
                'email' => 'agus.demo@example.test',
                'status' => Driver::STATUS_AVAILABLE,
            ],
            [
                'license_number' => 'SIM-B1-DEMO-002',
                'name' => 'Bambang Wijaya',
                'license_type' => 'B1',
                'license_expires_at' => now()->addDays(8)->toDateString(),
                'phone' => '081234567802',
                'email' => 'bambang.demo@example.test',
                'status' => Driver::STATUS_AVAILABLE,
            ],
            [
                'license_number' => 'SIM-B2-DEMO-003',
                'name' => 'Candra Kusuma',
                'license_type' => 'B2',
                'license_expires_at' => now()->addYears(3)->toDateString(),
                'phone' => '081234567803',
                'email' => 'candra.demo@example.test',
                'status' => Driver::STATUS_AVAILABLE,
            ],
            [
                'license_number' => 'SIM-A-DEMO-004',
                'name' => 'Dedi Hermawan',
                'license_type' => 'A',
                'license_expires_at' => now()->addYears(2)->toDateString(),
                'phone' => '081234567804',
                'email' => 'dedi.demo@example.test',
                'status' => Driver::STATUS_AVAILABLE,
            ],
            [
                'license_number' => 'SIM-B2-DEMO-005',
                'name' => 'Eko Prasetyo',
                'license_type' => 'B2',
                'license_expires_at' => now()->addDays(12)->toDateString(),
                'phone' => '081234567805',
                'email' => 'eko.demo@example.test',
                'status' => Driver::STATUS_AVAILABLE,
            ],
        ];

        $drivers = [];

        foreach ($defs as $def) {
            $license = $def['license_number'];
            unset($def['license_number']);

            $drivers[] = Driver::query()->updateOrCreate(
                ['license_number' => $license],
                $def,
            );
        }

        return $drivers;
    }

    /**
     * @param  list<Vehicle>  $vehicles
     * @param  Collection<string, DocumentType>  $types
     */
    protected function seedVehicleDocuments(array $vehicles, Collection $types, int $userId): void
    {
        // V1 — STNK expired, KIR expiring soon, asuransi valid, BPKB permanent
        $this->doc($vehicles[0], $types, 'stnk', $userId, [
            'document_number' => 'STNK-2022-DEMO-01',
            'issued_at' => now()->subYears(2),
            'expires_at' => now()->subDays(30),
        ]);
        $this->doc($vehicles[0], $types, 'kir', $userId, [
            'document_number' => 'KIR-2024-DEMO-01',
            'issued_at' => now()->subMonths(5),
            'expires_at' => now()->addDays(5),
        ]);
        $this->doc($vehicles[0], $types, 'vehicle_insurance', $userId, [
            'document_number' => 'POL-2024-DEMO-01',
            'issued_at' => now()->subMonths(4),
            'expires_at' => now()->addMonths(8),
            'verified_by' => $userId,
            'verified_at' => now()->subDays(3),
        ]);
        $this->doc($vehicles[0], $types, 'bpkb', $userId, [
            'document_number' => 'BPKB-2020-DEMO-01',
            'issued_at' => now()->subYears(4),
            'expires_at' => null,
        ]);

        // V2 — semua expiring soon
        $this->doc($vehicles[1], $types, 'stnk', $userId, [
            'document_number' => 'STNK-2023-DEMO-02',
            'issued_at' => now()->subMonths(11),
            'expires_at' => now()->addDays(22),
        ]);
        $this->doc($vehicles[1], $types, 'kir', $userId, [
            'document_number' => 'KIR-2024-DEMO-02',
            'issued_at' => now()->subMonths(5),
            'expires_at' => now()->addDays(15),
        ]);
        $this->doc($vehicles[1], $types, 'vehicle_insurance', $userId, [
            'document_number' => 'POL-2023-DEMO-02',
            'issued_at' => now()->subMonths(11),
            'expires_at' => now()->addDays(10),
        ]);

        // V3 — semua valid & verified
        $this->doc($vehicles[2], $types, 'stnk', $userId, [
            'document_number' => 'STNK-2024-DEMO-03',
            'issued_at' => now()->subMonths(2),
            'expires_at' => now()->addMonths(10),
            'verified_by' => $userId,
            'verified_at' => now()->subDays(7),
        ]);
        $this->doc($vehicles[2], $types, 'kir', $userId, [
            'document_number' => 'KIR-2024-DEMO-03',
            'issued_at' => now()->subMonths(1),
            'expires_at' => now()->addMonths(5),
            'verified_by' => $userId,
            'verified_at' => now()->subDays(2),
        ]);
        $this->doc($vehicles[2], $types, 'vehicle_insurance', $userId, [
            'document_number' => 'POL-2024-DEMO-03',
            'issued_at' => now()->subMonths(1),
            'expires_at' => now()->addMonths(11),
            'verified_by' => $userId,
            'verified_at' => now()->subDay(),
        ]);
        $this->doc($vehicles[2], $types, 'bpkb', $userId, [
            'document_number' => 'BPKB-2021-DEMO-03',
            'issued_at' => now()->subYears(3),
            'expires_at' => null,
            'verified_by' => $userId,
            'verified_at' => now()->subDays(10),
        ]);

        // V4 — STNK + asuransi saja (KIR sengaja kosong)
        $this->doc($vehicles[3], $types, 'stnk', $userId, [
            'document_number' => 'STNK-2024-DEMO-04',
            'issued_at' => now()->subMonths(3),
            'expires_at' => now()->addMonths(9),
        ]);
        $this->doc($vehicles[3], $types, 'vehicle_insurance', $userId, [
            'document_number' => 'POL-2024-DEMO-04',
            'issued_at' => now()->subMonths(2),
            'expires_at' => now()->addMonths(10),
        ]);

        // V5 — STNK & KIR expired
        $this->doc($vehicles[4], $types, 'stnk', $userId, [
            'document_number' => 'STNK-2021-DEMO-05',
            'issued_at' => now()->subYears(3),
            'expires_at' => now()->subYears(2),
        ]);
        $this->doc($vehicles[4], $types, 'kir', $userId, [
            'document_number' => 'KIR-2022-DEMO-05',
            'issued_at' => now()->subYears(2),
            'expires_at' => now()->subMonths(8),
        ]);
    }

    /**
     * @param  list<Driver>  $drivers
     * @param  Collection<string, DocumentType>  $types
     */
    protected function seedDriverDocuments(array $drivers, Collection $types, int $userId): void
    {
        // D1 — SIM B2 expired
        $this->doc($drivers[0], $types, 'ktp', $userId, [
            'document_number' => '3271010101800001',
            'issued_at' => now()->subYears(3),
            'expires_at' => now()->addYears(2),
            'verified_by' => $userId,
            'verified_at' => now()->subWeek(),
        ]);
        $this->doc($drivers[0], $types, 'sim_b2', $userId, [
            'document_number' => 'SIM-B2-DEMO-001',
            'issued_at' => now()->subYears(5),
            'expires_at' => now()->subDays(45),
        ]);
        $this->doc($drivers[0], $types, 'health_cert', $userId, [
            'document_number' => 'MCU-2024-DEMO-001',
            'issued_at' => now()->subMonths(6),
            'expires_at' => now()->addMonths(6),
        ]);

        // D2 — SIM B1 expiring soon
        $this->doc($drivers[1], $types, 'ktp', $userId, [
            'document_number' => '3271020202750002',
            'issued_at' => now()->subYears(2),
            'expires_at' => now()->addYears(3),
            'verified_by' => $userId,
            'verified_at' => now()->subDays(5),
        ]);
        $this->doc($drivers[1], $types, 'sim_b1', $userId, [
            'document_number' => 'SIM-B1-DEMO-002',
            'issued_at' => now()->subYears(5),
            'expires_at' => now()->addDays(8),
        ]);
        $this->doc($drivers[1], $types, 'skck', $userId, [
            'document_number' => 'SKCK-2024-DEMO-002',
            'issued_at' => now()->subMonths(8),
            'expires_at' => now()->addMonths(4),
            'verified_by' => $userId,
            'verified_at' => now()->subDays(2),
        ]);

        // D3 — semua valid & verified
        $this->doc($drivers[2], $types, 'ktp', $userId, [
            'document_number' => '3271030303800003',
            'issued_at' => now()->subYears(1),
            'expires_at' => now()->addYears(4),
            'verified_by' => $userId,
            'verified_at' => now()->subDays(14),
        ]);
        $this->doc($drivers[2], $types, 'sim_b2', $userId, [
            'document_number' => 'SIM-B2-DEMO-003',
            'issued_at' => now()->subYears(2),
            'expires_at' => now()->addYears(3),
            'verified_by' => $userId,
            'verified_at' => now()->subDays(10),
        ]);
        $this->doc($drivers[2], $types, 'skck', $userId, [
            'document_number' => 'SKCK-2024-DEMO-003',
            'issued_at' => now()->subMonths(3),
            'expires_at' => now()->addMonths(9),
            'verified_by' => $userId,
            'verified_at' => now()->subDays(1),
        ]);
        $this->doc($drivers[2], $types, 'health_cert', $userId, [
            'document_number' => 'MCU-2024-DEMO-003',
            'issued_at' => now()->subMonths(4),
            'expires_at' => now()->addMonths(8),
        ]);

        // D4 — KTP + SIM A saja
        $this->doc($drivers[3], $types, 'ktp', $userId, [
            'document_number' => '3271040404850004',
            'issued_at' => now()->subYears(4),
            'expires_at' => now()->addYears(1),
        ]);
        $this->doc($drivers[3], $types, 'sim_a', $userId, [
            'document_number' => 'SIM-A-DEMO-004',
            'issued_at' => now()->subYears(3),
            'expires_at' => now()->addYears(2),
        ]);

        // D5 — SIM B2 expiring soon
        $this->doc($drivers[4], $types, 'ktp', $userId, [
            'document_number' => '3271050505900005',
            'issued_at' => now()->subYears(2),
            'expires_at' => now()->addYears(3),
            'verified_by' => $userId,
            'verified_at' => now()->subDays(3),
        ]);
        $this->doc($drivers[4], $types, 'sim_b2', $userId, [
            'document_number' => 'SIM-B2-DEMO-005',
            'issued_at' => now()->subYears(5),
            'expires_at' => now()->addDays(12),
        ]);
        $this->doc($drivers[4], $types, 'health_cert', $userId, [
            'document_number' => 'MCU-2023-DEMO-005',
            'issued_at' => now()->subYears(1),
            'expires_at' => now()->addMonths(11),
        ]);
    }

    /**
     * @param  Collection<string, DocumentType>  $types
     * @param  array<string, mixed>  $overrides
     */
    protected function doc(Model $entity, Collection $types, string $typeKey, int $userId, array $overrides): void
    {
        if (! $types->has($typeKey)) {
            return;
        }

        /** @var DocumentType $type */
        $type = $types->get($typeKey);

        Document::query()->updateOrCreate(
            [
                'document_type_id' => $type->id,
                'documentable_type' => $type->entity_type,
                'documentable_id' => $entity->id,
            ],
            array_merge([
                'uploaded_by' => $userId,
                'verified_by' => null,
                'verified_at' => null,
                'media_id' => null,
                'notes' => null,
            ], $overrides),
        );
    }
}
