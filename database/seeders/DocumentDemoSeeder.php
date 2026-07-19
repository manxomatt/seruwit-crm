<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Modules\Document\Models\Document;
use Modules\Document\Models\DocumentType;
use Modules\Fleet\Models\Driver;
use Modules\Fleet\Models\Vehicle;

/**
 * Seeds realistic Document module demo data in the current tenant schema.
 * Run via: php artisan tenants:artisan "db:seed --class=DocumentDemoSeeder"
 */
class DocumentDemoSeeder extends Seeder
{
    public function run(): void
    {
        $userId = \App\Models\User::query()->value('id');

        if (! $userId) {
            $this->command->warn('No users found — run the main seeder first.');

            return;
        }

        // ── Vehicles ─────────────────────────────────────────────────────────
        $vehicles = [
            Vehicle::factory()->create([
                'name' => 'Truk Hino 500 #01',
                'plate_number' => 'B 1234 ABC',
                'type' => 'truck',
                'brand' => 'Hino',
                'model_year' => 2020,
                'status' => 'active',
            ]),
            Vehicle::factory()->create([
                'name' => 'Mitsubishi L300 #02',
                'plate_number' => 'B 5678 DEF',
                'type' => 'van',
                'brand' => 'Mitsubishi',
                'model_year' => 2019,
                'status' => 'active',
            ]),
            Vehicle::factory()->create([
                'name' => 'Toyota Fortuner #03',
                'plate_number' => 'D 9012 GHI',
                'type' => 'car',
                'brand' => 'Toyota',
                'model_year' => 2022,
                'status' => 'active',
            ]),
        ];

        // ── Drivers ──────────────────────────────────────────────────────────
        $drivers = [
            Driver::factory()->create([
                'name' => 'Budi Santoso',
                'license_number' => 'SIM-B1-001234',
                'license_type' => 'B1',
                'status' => 'available',
            ]),
            Driver::factory()->create([
                'name' => 'Ahmad Fauzi',
                'license_number' => 'SIM-B2-005678',
                'license_type' => 'B2',
                'status' => 'available',
            ]),
            Driver::factory()->create([
                'name' => 'Siti Rahayu',
                'license_number' => 'SIM-A-009012',
                'license_type' => 'A',
                'status' => 'off_duty',
            ]),
        ];

        // ── Document Types ────────────────────────────────────────────────────
        $vehicleTypes = DocumentType::query()
            ->where('entity_type', 'vehicle')
            ->orderBy('sort_order')
            ->get()
            ->keyBy('key');

        $driverTypes = DocumentType::query()
            ->where('entity_type', 'driver')
            ->orderBy('sort_order')
            ->get()
            ->keyBy('key');

        // ── Vehicle Documents ─────────────────────────────────────────────────
        // Truk Hino — STNK expired, KIR expiring in 6 days, Asuransi valid, BPKB no expiry
        $this->createDoc($vehicles[0], $vehicleTypes['stnk'], $userId, [
            'document_number' => 'STNK-2019-HIN01',
            'issued_at' => now()->subYears(2),
            'expires_at' => now()->subDays(45), // EXPIRED
        ]);
        $this->createDoc($vehicles[0], $vehicleTypes['kir'], $userId, [
            'document_number' => 'KIR-2024-001',
            'issued_at' => now()->subMonths(5),
            'expires_at' => now()->addDays(6), // EXPIRING SOON
        ]);
        $this->createDoc($vehicles[0], $vehicleTypes['vehicle_insurance'], $userId, [
            'document_number' => 'POL-2024-XYZ',
            'issued_at' => now()->subMonths(3),
            'expires_at' => now()->addMonths(9), // VALID
            'verified_by' => $userId,
            'verified_at' => now()->subDays(5),
        ]);
        if ($vehicleTypes->has('bpkb')) {
            $this->createDoc($vehicles[0], $vehicleTypes['bpkb'], $userId, [
                'document_number' => 'BPKB-2020-H01',
                'issued_at' => now()->subYears(4),
                'expires_at' => null, // PERMANENT
            ]);
        }

        // Mitsubishi L300 — semua dokumen expiring soon dalam 25 hari
        $this->createDoc($vehicles[1], $vehicleTypes['stnk'], $userId, [
            'document_number' => 'STNK-2023-MIT02',
            'issued_at' => now()->subMonths(11),
            'expires_at' => now()->addDays(25), // EXPIRING SOON (< 30 days)
        ]);
        $this->createDoc($vehicles[1], $vehicleTypes['kir'], $userId, [
            'document_number' => 'KIR-2024-002',
            'issued_at' => now()->subMonths(5),
            'expires_at' => now()->addDays(20),
        ]);
        $this->createDoc($vehicles[1], $vehicleTypes['vehicle_insurance'], $userId, [
            'document_number' => 'POL-2023-ABC',
            'issued_at' => now()->subMonths(11),
            'expires_at' => now()->addDays(18),
        ]);

        // Toyota Fortuner — semua dokumen valid & terverifikasi
        $this->createDoc($vehicles[2], $vehicleTypes['stnk'], $userId, [
            'document_number' => 'STNK-2024-TOY03',
            'issued_at' => now()->subMonths(2),
            'expires_at' => now()->addMonths(10),
            'verified_by' => $userId,
            'verified_at' => now()->subDays(2),
        ]);
        $this->createDoc($vehicles[2], $vehicleTypes['kir'], $userId, [
            'document_number' => 'KIR-2024-003',
            'issued_at' => now()->subMonths(1),
            'expires_at' => now()->addMonths(5),
            'verified_by' => $userId,
            'verified_at' => now()->subDay(),
        ]);
        $this->createDoc($vehicles[2], $vehicleTypes['vehicle_insurance'], $userId, [
            'document_number' => 'POL-2024-NEW',
            'issued_at' => now()->subMonths(1),
            'expires_at' => now()->addMonths(11),
        ]);

        // ── Driver Documents ──────────────────────────────────────────────────
        // Budi Santoso — SIM B1 expired, KTP valid, SKCK missing
        if ($driverTypes->has('ktp')) {
            $this->createDoc($drivers[0], $driverTypes['ktp'], $userId, [
                'document_number' => '3201010101800001',
                'issued_at' => now()->subYears(3),
                'expires_at' => now()->addYears(2),
                'verified_by' => $userId,
                'verified_at' => now()->subDays(10),
            ]);
        }
        if ($driverTypes->has('sim_b1')) {
            $this->createDoc($drivers[0], $driverTypes['sim_b1'], $userId, [
                'document_number' => 'SIM-B1-001234',
                'issued_at' => now()->subYears(5),
                'expires_at' => now()->subDays(30), // EXPIRED
            ]);
        }
        if ($driverTypes->has('health_cert')) {
            $this->createDoc($drivers[0], $driverTypes['health_cert'], $userId, [
                'document_number' => 'RS-2024-00124',
                'issued_at' => now()->subMonths(8),
                'expires_at' => now()->addMonths(4),
            ]);
        }

        // Ahmad Fauzi — semua valid
        if ($driverTypes->has('ktp')) {
            $this->createDoc($drivers[1], $driverTypes['ktp'], $userId, [
                'document_number' => '3273010203750001',
                'issued_at' => now()->subYears(2),
                'expires_at' => now()->addYears(3),
                'verified_by' => $userId,
                'verified_at' => now()->subWeek(),
            ]);
        }
        if ($driverTypes->has('sim_b2')) {
            $this->createDoc($drivers[1], $driverTypes['sim_b2'], $userId, [
                'document_number' => 'SIM-B2-005678',
                'issued_at' => now()->subYears(1),
                'expires_at' => now()->addYears(4),
            ]);
        }
        if ($driverTypes->has('skck')) {
            $this->createDoc($drivers[1], $driverTypes['skck'], $userId, [
                'document_number' => 'SKCK-2024-007',
                'issued_at' => now()->subMonths(6),
                'expires_at' => now()->addMonths(6),
                'verified_by' => $userId,
                'verified_at' => now()->subDays(3),
            ]);
        }

        // Siti Rahayu — SIM A expiring soon (10 hari)
        if ($driverTypes->has('ktp')) {
            $this->createDoc($drivers[2], $driverTypes['ktp'], $userId, [
                'document_number' => '3201040205900001',
                'issued_at' => now()->subYears(4),
                'expires_at' => now()->addYear(),
            ]);
        }
        if ($driverTypes->has('sim_a')) {
            $this->createDoc($drivers[2], $driverTypes['sim_a'], $userId, [
                'document_number' => 'SIM-A-009012',
                'issued_at' => now()->subYears(5),
                'expires_at' => now()->addDays(10), // EXPIRING SOON
            ]);
        }

        $this->command->info('Document demo data seeded successfully.');
    }

    /**
     * @param  array<string, mixed>  $overrides
     */
    private function createDoc(
        \Illuminate\Database\Eloquent\Model $entity,
        DocumentType $type,
        int $userId,
        array $overrides,
    ): void {
        Document::query()->create(array_merge([
            'document_type_id' => $type->id,
            'documentable_type' => $type->entity_type,
            'documentable_id' => $entity->id,
            'uploaded_by' => $userId,
            'verified_by' => null,
            'verified_at' => null,
            'media_id' => null,
            'notes' => null,
        ], $overrides));
    }
}
