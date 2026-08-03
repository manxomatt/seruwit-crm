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
 * Seeds compliance documents for the 30 demo vehicles + 30 demo drivers.
 * Ensures fleet demos exist first (TenantVehicleDemoSeeder / TenantDriverDemoSeeder).
 *
 *   php artisan tenants:seed --class=TenantDocumentDemoSeeder --tenants={id}
 */
class TenantDocumentDemoSeeder extends Seeder
{
    public const TAG = '[DOC-DEMO]';

    public function run(): void
    {
        if (! class_exists(Document::class) || ! Schema::hasTable('documents') || ! Schema::hasTable('document_types')) {
            $this->command?->warn('Document tables missing. Install the document module first.');

            return;
        }

        if (! class_exists(Vehicle::class) || ! Schema::hasTable('vehicles') || ! Schema::hasTable('drivers')) {
            throw new \RuntimeException('Install the [fleet] module before installing this demo data.');
        }

        $userId = User::query()->value('id');

        if (! $userId) {
            $this->command?->warn('No users found in this tenant.');

            return;
        }

        $this->call([
            TenantVehicleDemoSeeder::class,
            TenantDriverDemoSeeder::class,
        ]);

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

        $vehicles = Vehicle::query()
            ->where('plate_number', 'like', TenantVehicleDemoSeeder::PLATE_PREFIX.' %')
            ->orderBy('plate_number')
            ->get();

        $drivers = Driver::query()
            ->where('license_number', 'like', TenantDriverDemoSeeder::LICENSE_PREFIX.'-%')
            ->orderBy('license_number')
            ->get();

        if ($vehicles->count() < 30 || $drivers->count() < 30) {
            $this->command?->warn(sprintf(
                'Expected 30 demo vehicles and drivers, found %d / %d.',
                $vehicles->count(),
                $drivers->count(),
            ));

            return;
        }

        foreach ($vehicles->values() as $index => $vehicle) {
            $this->seedVehicleDocuments($vehicle, $vehicleTypes, (int) $userId, $index + 1);
        }

        foreach ($drivers->values() as $index => $driver) {
            $this->seedDriverDocuments($driver, $driverTypes, (int) $userId, $index + 1);
        }

        $this->command?->info(sprintf(
            'Document demo ready for %d vehicles and %d drivers (%d documents total).',
            $vehicles->count(),
            $drivers->count(),
            Document::query()->count(),
        ));
    }

    public function isInstalled(): bool
    {
        if (! class_exists(Document::class) || ! Schema::hasTable('documents')) {
            return false;
        }

        return Document::query()->where('notes', 'like', '%'.self::TAG.'%')->exists();
    }

    public function uninstall(): void
    {
        if (! class_exists(Document::class) || ! Schema::hasTable('documents')) {
            return;
        }

        $deleted = Document::query()
            ->where('notes', 'like', '%'.self::TAG.'%')
            ->delete();

        $this->command?->info("Document demo data removed ({$deleted} documents).");
    }

    /**
     * @param  Collection<string, DocumentType>  $types
     */
    private function seedVehicleDocuments(Vehicle $vehicle, Collection $types, int $userId, int $n): void
    {
        $pad = sprintf('%02d', $n);

        match (($n - 1) % 5) {
            0 => $this->vehicleScenarioExpiredStnk($vehicle, $types, $userId, $pad),
            1 => $this->vehicleScenarioExpiringSoon($vehicle, $types, $userId, $pad),
            2 => $this->vehicleScenarioAllValid($vehicle, $types, $userId, $pad),
            3 => $this->vehicleScenarioMissingKir($vehicle, $types, $userId, $pad),
            default => $this->vehicleScenarioExpiredDocs($vehicle, $types, $userId, $pad),
        };
    }

    /**
     * @param  Collection<string, DocumentType>  $types
     */
    private function vehicleScenarioExpiredStnk(Vehicle $vehicle, Collection $types, int $userId, string $pad): void
    {
        $this->doc($vehicle, $types, 'stnk', $userId, [
            'document_number' => "STNK-2022-{$pad}",
            'issued_at' => now()->subYears(2),
            'expires_at' => now()->subDays(30),
            'notes' => 'Demo: STNK expired',
        ]);
        $this->doc($vehicle, $types, 'kir', $userId, [
            'document_number' => "KIR-2024-{$pad}",
            'issued_at' => now()->subMonths(5),
            'expires_at' => now()->addDays(5),
            'notes' => 'Demo: KIR expiring soon',
        ]);
        $this->doc($vehicle, $types, 'vehicle_insurance', $userId, [
            'document_number' => "POL-2024-{$pad}",
            'issued_at' => now()->subMonths(4),
            'expires_at' => now()->addMonths(8),
            'verified_by' => $userId,
            'verified_at' => now()->subDays(3),
        ]);
        $this->doc($vehicle, $types, 'bpkb', $userId, [
            'document_number' => "BPKB-2020-{$pad}",
            'issued_at' => now()->subYears(4),
            'expires_at' => null,
        ]);
    }

    /**
     * @param  Collection<string, DocumentType>  $types
     */
    private function vehicleScenarioExpiringSoon(Vehicle $vehicle, Collection $types, int $userId, string $pad): void
    {
        $this->doc($vehicle, $types, 'stnk', $userId, [
            'document_number' => "STNK-2023-{$pad}",
            'issued_at' => now()->subMonths(11),
            'expires_at' => now()->addDays(22),
        ]);
        $this->doc($vehicle, $types, 'kir', $userId, [
            'document_number' => "KIR-2024-{$pad}",
            'issued_at' => now()->subMonths(5),
            'expires_at' => now()->addDays(15),
        ]);
        $this->doc($vehicle, $types, 'vehicle_insurance', $userId, [
            'document_number' => "POL-2023-{$pad}",
            'issued_at' => now()->subMonths(11),
            'expires_at' => now()->addDays(10),
        ]);
    }

    /**
     * @param  Collection<string, DocumentType>  $types
     */
    private function vehicleScenarioAllValid(Vehicle $vehicle, Collection $types, int $userId, string $pad): void
    {
        $this->doc($vehicle, $types, 'stnk', $userId, [
            'document_number' => "STNK-2024-{$pad}",
            'issued_at' => now()->subMonths(2),
            'expires_at' => now()->addMonths(10),
            'verified_by' => $userId,
            'verified_at' => now()->subDays(7),
        ]);
        $this->doc($vehicle, $types, 'kir', $userId, [
            'document_number' => "KIR-2024-{$pad}",
            'issued_at' => now()->subMonths(1),
            'expires_at' => now()->addMonths(5),
            'verified_by' => $userId,
            'verified_at' => now()->subDays(2),
        ]);
        $this->doc($vehicle, $types, 'vehicle_insurance', $userId, [
            'document_number' => "POL-2024-{$pad}",
            'issued_at' => now()->subMonths(1),
            'expires_at' => now()->addMonths(11),
            'verified_by' => $userId,
            'verified_at' => now()->subDay(),
        ]);
        $this->doc($vehicle, $types, 'bpkb', $userId, [
            'document_number' => "BPKB-2021-{$pad}",
            'issued_at' => now()->subYears(3),
            'expires_at' => null,
            'verified_by' => $userId,
            'verified_at' => now()->subDays(10),
        ]);
    }

    /**
     * @param  Collection<string, DocumentType>  $types
     */
    private function vehicleScenarioMissingKir(Vehicle $vehicle, Collection $types, int $userId, string $pad): void
    {
        $this->doc($vehicle, $types, 'stnk', $userId, [
            'document_number' => "STNK-2024-{$pad}",
            'issued_at' => now()->subMonths(3),
            'expires_at' => now()->addMonths(9),
            'notes' => 'Demo: KIR missing',
        ]);
        $this->doc($vehicle, $types, 'vehicle_insurance', $userId, [
            'document_number' => "POL-2024-{$pad}",
            'issued_at' => now()->subMonths(2),
            'expires_at' => now()->addMonths(10),
        ]);
    }

    /**
     * @param  Collection<string, DocumentType>  $types
     */
    private function vehicleScenarioExpiredDocs(Vehicle $vehicle, Collection $types, int $userId, string $pad): void
    {
        $this->doc($vehicle, $types, 'stnk', $userId, [
            'document_number' => "STNK-2021-{$pad}",
            'issued_at' => now()->subYears(3),
            'expires_at' => now()->subYears(2),
            'notes' => 'Demo: STNK expired',
        ]);
        $this->doc($vehicle, $types, 'kir', $userId, [
            'document_number' => "KIR-2022-{$pad}",
            'issued_at' => now()->subYears(2),
            'expires_at' => now()->subMonths(8),
            'notes' => 'Demo: KIR expired',
        ]);
    }

    /**
     * @param  Collection<string, DocumentType>  $types
     */
    private function seedDriverDocuments(Driver $driver, Collection $types, int $userId, int $n): void
    {
        $pad = sprintf('%02d', $n);
        $simKey = $this->simTypeKey($driver->license_type);
        $simNumber = sprintf('SIM-%s-DEMO-%s', strtoupper((string) ($driver->license_type ?: 'B2')), $pad);

        match (($n - 1) % 5) {
            0 => $this->driverScenarioExpiredSim($driver, $types, $userId, $pad, $simKey, $simNumber),
            1 => $this->driverScenarioExpiringSoon($driver, $types, $userId, $pad, $simKey, $simNumber),
            2 => $this->driverScenarioAllValid($driver, $types, $userId, $pad, $simKey, $simNumber),
            3 => $this->driverScenarioMinimal($driver, $types, $userId, $pad, $simKey, $simNumber),
            default => $this->driverScenarioExpiringWithHealth($driver, $types, $userId, $pad, $simKey, $simNumber),
        };
    }

    /**
     * @param  Collection<string, DocumentType>  $types
     */
    private function driverScenarioExpiredSim(
        Driver $driver,
        Collection $types,
        int $userId,
        string $pad,
        string $simKey,
        string $simNumber,
    ): void {
        $this->doc($driver, $types, 'ktp', $userId, [
            'document_number' => sprintf('327101%08d', (int) $pad),
            'issued_at' => now()->subYears(3),
            'expires_at' => now()->addYears(2),
            'verified_by' => $userId,
            'verified_at' => now()->subWeek(),
        ]);
        $this->doc($driver, $types, $simKey, $userId, [
            'document_number' => $simNumber,
            'issued_at' => now()->subYears(5),
            'expires_at' => now()->subDays(45),
            'notes' => 'Demo: SIM expired',
        ]);
        $this->doc($driver, $types, 'health_cert', $userId, [
            'document_number' => "MCU-2024-{$pad}",
            'issued_at' => now()->subMonths(6),
            'expires_at' => now()->addMonths(6),
        ]);
    }

    /**
     * @param  Collection<string, DocumentType>  $types
     */
    private function driverScenarioExpiringSoon(
        Driver $driver,
        Collection $types,
        int $userId,
        string $pad,
        string $simKey,
        string $simNumber,
    ): void {
        $this->doc($driver, $types, 'ktp', $userId, [
            'document_number' => sprintf('327102%08d', (int) $pad),
            'issued_at' => now()->subYears(2),
            'expires_at' => now()->addYears(3),
            'verified_by' => $userId,
            'verified_at' => now()->subDays(5),
        ]);
        $this->doc($driver, $types, $simKey, $userId, [
            'document_number' => $simNumber,
            'issued_at' => now()->subYears(5),
            'expires_at' => now()->addDays(8),
            'notes' => 'Demo: SIM expiring soon',
        ]);
        $this->doc($driver, $types, 'skck', $userId, [
            'document_number' => "SKCK-2024-{$pad}",
            'issued_at' => now()->subMonths(8),
            'expires_at' => now()->addMonths(4),
            'verified_by' => $userId,
            'verified_at' => now()->subDays(2),
        ]);
    }

    /**
     * @param  Collection<string, DocumentType>  $types
     */
    private function driverScenarioAllValid(
        Driver $driver,
        Collection $types,
        int $userId,
        string $pad,
        string $simKey,
        string $simNumber,
    ): void {
        $this->doc($driver, $types, 'ktp', $userId, [
            'document_number' => sprintf('327103%08d', (int) $pad),
            'issued_at' => now()->subYears(1),
            'expires_at' => now()->addYears(4),
            'verified_by' => $userId,
            'verified_at' => now()->subDays(14),
        ]);
        $this->doc($driver, $types, $simKey, $userId, [
            'document_number' => $simNumber,
            'issued_at' => now()->subYears(2),
            'expires_at' => now()->addYears(3),
            'verified_by' => $userId,
            'verified_at' => now()->subDays(10),
        ]);
        $this->doc($driver, $types, 'skck', $userId, [
            'document_number' => "SKCK-2024-{$pad}",
            'issued_at' => now()->subMonths(3),
            'expires_at' => now()->addMonths(9),
            'verified_by' => $userId,
            'verified_at' => now()->subDays(1),
        ]);
        $this->doc($driver, $types, 'health_cert', $userId, [
            'document_number' => "MCU-2024-{$pad}",
            'issued_at' => now()->subMonths(4),
            'expires_at' => now()->addMonths(8),
        ]);
    }

    /**
     * @param  Collection<string, DocumentType>  $types
     */
    private function driverScenarioMinimal(
        Driver $driver,
        Collection $types,
        int $userId,
        string $pad,
        string $simKey,
        string $simNumber,
    ): void {
        $this->doc($driver, $types, 'ktp', $userId, [
            'document_number' => sprintf('327104%08d', (int) $pad),
            'issued_at' => now()->subYears(4),
            'expires_at' => now()->addYears(1),
            'notes' => 'Demo: SKCK/health missing',
        ]);
        $this->doc($driver, $types, $simKey, $userId, [
            'document_number' => $simNumber,
            'issued_at' => now()->subYears(3),
            'expires_at' => now()->addYears(2),
        ]);
    }

    /**
     * @param  Collection<string, DocumentType>  $types
     */
    private function driverScenarioExpiringWithHealth(
        Driver $driver,
        Collection $types,
        int $userId,
        string $pad,
        string $simKey,
        string $simNumber,
    ): void {
        $this->doc($driver, $types, 'ktp', $userId, [
            'document_number' => sprintf('327105%08d', (int) $pad),
            'issued_at' => now()->subYears(2),
            'expires_at' => now()->addYears(3),
            'verified_by' => $userId,
            'verified_at' => now()->subDays(3),
        ]);
        $this->doc($driver, $types, $simKey, $userId, [
            'document_number' => $simNumber,
            'issued_at' => now()->subYears(5),
            'expires_at' => now()->addDays(12),
            'notes' => 'Demo: SIM expiring soon',
        ]);
        $this->doc($driver, $types, 'health_cert', $userId, [
            'document_number' => "MCU-2023-{$pad}",
            'issued_at' => now()->subYears(1),
            'expires_at' => now()->addMonths(11),
        ]);
    }

    private function simTypeKey(?string $licenseType): string
    {
        return match (strtoupper((string) $licenseType)) {
            'A' => 'sim_a',
            'B1' => 'sim_b1',
            default => 'sim_b2',
        };
    }

    /**
     * @param  Collection<string, DocumentType>  $types
     * @param  array<string, mixed>  $overrides
     */
    private function doc(Model $entity, Collection $types, string $typeKey, int $userId, array $overrides): void
    {
        if (! $types->has($typeKey)) {
            return;
        }

        /** @var DocumentType $type */
        $type = $types->get($typeKey);

        $notes = trim((string) ($overrides['notes'] ?? ''));
        $overrides['notes'] = trim($notes.' '.self::TAG);

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
