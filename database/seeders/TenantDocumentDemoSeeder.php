<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Modules\Document\Models\Document;
use Modules\Document\Models\DocumentType;
use Modules\Fleet\Models\Driver;
use Modules\Fleet\Models\Vehicle;

/**
 * Seeds Document demo data using entities that already exist in the current
 * tenant schema. Run in a specific tenant via:
 *
 *   php artisan tenants:seed --class=TenantDocumentDemoSeeder --tenants={id}
 */
class TenantDocumentDemoSeeder extends Seeder
{
    public function run(): void
    {
        $userId = \App\Models\User::query()->value('id');

        if (! $userId) {
            $this->command->warn('No users found in this tenant.');

            return;
        }

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

        if ($vehicleTypes->isEmpty() || $driverTypes->isEmpty()) {
            $this->command->warn('Document types not found. Run migrations first.');

            return;
        }

        $vehicles = Vehicle::query()->get();
        $drivers = Driver::query()->get();

        if ($vehicles->isEmpty() || $drivers->isEmpty()) {
            $this->command->warn('No vehicles or drivers found. Seed Fleet data first.');

            return;
        }

        // ── Vehicle 1: Truk Colt Diesel 1 — STNK expired, KIR expiring soon ─
        $v1 = $vehicles->firstWhere('id', 1) ?? $vehicles->get(0);
        if ($v1) {
            $this->doc($v1, $vehicleTypes, 'stnk', $userId, [
                'document_number' => 'STNK-2022-001',
                'issued_at' => now()->subYears(2),
                'expires_at' => now()->subDays(30),
            ]);
            $this->doc($v1, $vehicleTypes, 'kir', $userId, [
                'document_number' => 'KIR-2024-001',
                'issued_at' => now()->subMonths(5),
                'expires_at' => now()->addDays(5),
            ]);
            $this->doc($v1, $vehicleTypes, 'vehicle_insurance', $userId, [
                'document_number' => 'POL-2024-001',
                'issued_at' => now()->subMonths(4),
                'expires_at' => now()->addMonths(8),
                'verified_by' => $userId,
                'verified_at' => now()->subDays(3),
            ]);
            $this->doc($v1, $vehicleTypes, 'bpkb', $userId, [
                'document_number' => 'BPKB-2020-001',
                'issued_at' => now()->subYears(4),
                'expires_at' => null,
            ]);
        }

        // ── Vehicle 2: Truk Colt Diesel 2 — semua expiring soon (<30 hari) ──
        $v2 = $vehicles->firstWhere('id', 2) ?? $vehicles->get(1);
        if ($v2) {
            $this->doc($v2, $vehicleTypes, 'stnk', $userId, [
                'document_number' => 'STNK-2023-002',
                'issued_at' => now()->subMonths(11),
                'expires_at' => now()->addDays(22),
            ]);
            $this->doc($v2, $vehicleTypes, 'kir', $userId, [
                'document_number' => 'KIR-2024-002',
                'issued_at' => now()->subMonths(5),
                'expires_at' => now()->addDays(15),
            ]);
            $this->doc($v2, $vehicleTypes, 'vehicle_insurance', $userId, [
                'document_number' => 'POL-2023-002',
                'issued_at' => now()->subMonths(11),
                'expires_at' => now()->addDays(10),
            ]);
        }

        // ── Vehicle 3: Van Delivery 1 — semua valid & terverifikasi ──────────
        $v3 = $vehicles->firstWhere('id', 3) ?? $vehicles->get(2);
        if ($v3) {
            $this->doc($v3, $vehicleTypes, 'stnk', $userId, [
                'document_number' => 'STNK-2024-003',
                'issued_at' => now()->subMonths(2),
                'expires_at' => now()->addMonths(10),
                'verified_by' => $userId,
                'verified_at' => now()->subDays(7),
            ]);
            $this->doc($v3, $vehicleTypes, 'kir', $userId, [
                'document_number' => 'KIR-2024-003',
                'issued_at' => now()->subMonths(1),
                'expires_at' => now()->addMonths(5),
                'verified_by' => $userId,
                'verified_at' => now()->subDays(2),
            ]);
            $this->doc($v3, $vehicleTypes, 'vehicle_insurance', $userId, [
                'document_number' => 'POL-2024-003',
                'issued_at' => now()->subMonths(1),
                'expires_at' => now()->addMonths(11),
                'verified_by' => $userId,
                'verified_at' => now()->subDay(),
            ]);
            $this->doc($v3, $vehicleTypes, 'bpkb', $userId, [
                'document_number' => 'BPKB-2021-003',
                'issued_at' => now()->subYears(3),
                'expires_at' => null,
                'verified_by' => $userId,
                'verified_at' => now()->subDays(10),
            ]);
        }

        // ── Vehicle 4: Van Delivery 2 — KIR belum ada, STNK valid ────────────
        $v4 = $vehicles->firstWhere('id', 4) ?? $vehicles->get(3);
        if ($v4) {
            $this->doc($v4, $vehicleTypes, 'stnk', $userId, [
                'document_number' => 'STNK-2024-004',
                'issued_at' => now()->subMonths(3),
                'expires_at' => now()->addMonths(9),
            ]);
            $this->doc($v4, $vehicleTypes, 'vehicle_insurance', $userId, [
                'document_number' => 'POL-2024-004',
                'issued_at' => now()->subMonths(2),
                'expires_at' => now()->addMonths(10),
            ]);
            // KIR sengaja tidak ada untuk menguji tampilan "Belum ada"
        }

        // ── Vehicle 5: Mobil Box Lama — KIR & STNK keduanya expired ──────────
        $v5 = $vehicles->firstWhere('id', 5) ?? $vehicles->get(4);
        if ($v5) {
            $this->doc($v5, $vehicleTypes, 'stnk', $userId, [
                'document_number' => 'STNK-2021-005',
                'issued_at' => now()->subYears(3),
                'expires_at' => now()->subYears(2),
            ]);
            $this->doc($v5, $vehicleTypes, 'kir', $userId, [
                'document_number' => 'KIR-2022-005',
                'issued_at' => now()->subYears(2),
                'expires_at' => now()->subMonths(8),
            ]);
        }

        // ── Driver 1: Agus Setiawan (B2) — SIM B2 expired, KTP valid ─────────
        $d1 = $drivers->firstWhere('id', 1) ?? $drivers->get(0);
        if ($d1) {
            $this->doc($d1, $driverTypes, 'ktp', $userId, [
                'document_number' => '3271010101800001',
                'issued_at' => now()->subYears(3),
                'expires_at' => now()->addYears(2),
                'verified_by' => $userId,
                'verified_at' => now()->subWeek(),
            ]);
            $this->doc($d1, $driverTypes, 'sim_b2', $userId, [
                'document_number' => 'SIM-B2-AGS001',
                'issued_at' => now()->subYears(5),
                'expires_at' => now()->subDays(45),
            ]);
            $this->doc($d1, $driverTypes, 'health_cert', $userId, [
                'document_number' => 'MCU-2024-AGS001',
                'issued_at' => now()->subMonths(6),
                'expires_at' => now()->addMonths(6),
            ]);
        }

        // ── Driver 2: Bambang Wijaya (B1) — SIM B1 expiring soon (8 hari) ───
        $d2 = $drivers->firstWhere('id', 2) ?? $drivers->get(1);
        if ($d2) {
            $this->doc($d2, $driverTypes, 'ktp', $userId, [
                'document_number' => '3271020202750002',
                'issued_at' => now()->subYears(2),
                'expires_at' => now()->addYears(3),
                'verified_by' => $userId,
                'verified_at' => now()->subDays(5),
            ]);
            $this->doc($d2, $driverTypes, 'sim_b1', $userId, [
                'document_number' => 'SIM-B1-BAM002',
                'issued_at' => now()->subYears(5),
                'expires_at' => now()->addDays(8),
            ]);
            $this->doc($d2, $driverTypes, 'skck', $userId, [
                'document_number' => 'SKCK-2024-BAM002',
                'issued_at' => now()->subMonths(8),
                'expires_at' => now()->addMonths(4),
                'verified_by' => $userId,
                'verified_at' => now()->subDays(2),
            ]);
        }

        // ── Driver 3: Candra Kusuma (B2) — semua valid & terverifikasi ────────
        $d3 = $drivers->firstWhere('id', 3) ?? $drivers->get(2);
        if ($d3) {
            $this->doc($d3, $driverTypes, 'ktp', $userId, [
                'document_number' => '3271030303800003',
                'issued_at' => now()->subYears(1),
                'expires_at' => now()->addYears(4),
                'verified_by' => $userId,
                'verified_at' => now()->subDays(14),
            ]);
            $this->doc($d3, $driverTypes, 'sim_b2', $userId, [
                'document_number' => 'SIM-B2-CAN003',
                'issued_at' => now()->subYears(2),
                'expires_at' => now()->addYears(3),
                'verified_by' => $userId,
                'verified_at' => now()->subDays(10),
            ]);
            $this->doc($d3, $driverTypes, 'skck', $userId, [
                'document_number' => 'SKCK-2024-CAN003',
                'issued_at' => now()->subMonths(3),
                'expires_at' => now()->addMonths(9),
                'verified_by' => $userId,
                'verified_at' => now()->subDays(1),
            ]);
            $this->doc($d3, $driverTypes, 'health_cert', $userId, [
                'document_number' => 'MCU-2024-CAN003',
                'issued_at' => now()->subMonths(4),
                'expires_at' => now()->addMonths(8),
            ]);
        }

        // ── Driver 4: Dedi Hermawan (A) — KTP + SIM A saja, SKCK belum ada ──
        $d4 = $drivers->firstWhere('id', 4) ?? $drivers->get(3);
        if ($d4) {
            $this->doc($d4, $driverTypes, 'ktp', $userId, [
                'document_number' => '3271040404850004',
                'issued_at' => now()->subYears(4),
                'expires_at' => now()->addYears(1),
            ]);
            $this->doc($d4, $driverTypes, 'sim_a', $userId, [
                'document_number' => 'SIM-A-DED004',
                'issued_at' => now()->subYears(3),
                'expires_at' => now()->addYears(2),
            ]);
        }

        // ── Driver 5: Eko Prasetyo (B2) — SIM B2 expiring soon (12 hari) ────
        $d5 = $drivers->firstWhere('id', 5) ?? $drivers->get(4);
        if ($d5) {
            $this->doc($d5, $driverTypes, 'ktp', $userId, [
                'document_number' => '3271050505900005',
                'issued_at' => now()->subYears(2),
                'expires_at' => now()->addYears(3),
                'verified_by' => $userId,
                'verified_at' => now()->subDays(3),
            ]);
            $this->doc($d5, $driverTypes, 'sim_b2', $userId, [
                'document_number' => 'SIM-B2-EKO005',
                'issued_at' => now()->subYears(5),
                'expires_at' => now()->addDays(12),
            ]);
            $this->doc($d5, $driverTypes, 'health_cert', $userId, [
                'document_number' => 'MCU-2023-EKO005',
                'issued_at' => now()->subYears(1),
                'expires_at' => now()->addMonths(11),
            ]);
        }

        $this->command->info('Tenant document demo data seeded successfully.');
    }

    /**
     * @param  \Illuminate\Support\Collection<string, DocumentType>  $types
     * @param  array<string, mixed>  $overrides
     */
    private function doc(
        \Illuminate\Database\Eloquent\Model $entity,
        \Illuminate\Support\Collection $types,
        string $typeKey,
        int $userId,
        array $overrides,
    ): void {
        if (! $types->has($typeKey)) {
            return;
        }

        $type = $types->get($typeKey);

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
