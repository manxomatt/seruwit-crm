<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Modules\Document\Models\Document;
use Modules\Document\Models\DocumentType;
use Modules\Fleet\Models\Driver;

/**
 * Seeds 30 demo rental fleet drivers (SIM A, A Umum, B1, B1 Umum) with portal accounts,
 * compliance documents, and operational statuses.
 *
 *   php artisan tenants:seed --class=TenantDriverDemoSeeder --tenants={id}
 */
class TenantDriverDemoSeeder extends Seeder
{
    public const TAG = 'driver-demo';

    public const LICENSE_PREFIX = 'SIM-DEMO';

    public function run(): void
    {
        if (! class_exists(Driver::class) || ! Schema::hasTable('drivers')) {
            $this->command?->warn('Fleet drivers table missing. Install the fleet module first.');

            return;
        }

        $created = 0;
        $updated = 0;
        $driverRole = $this->resolveDriverRole();
        $uploaderId = class_exists(User::class) && Schema::hasTable('users')
            ? User::query()->orderBy('id')->value('id')
            : null;

        foreach ($this->definitions($driverRole) as $index => $def) {
            $license = $def['license_number'];
            unset($def['license_number']);

            /** @var Driver $driver */
            $driver = Driver::query()->updateOrCreate(
                ['license_number' => $license],
                $def,
            );

            if ($driver->wasRecentlyCreated) {
                $created++;
            } else {
                $updated++;
            }

            $this->seedDemoDocuments($driver, $index + 1, $uploaderId);
        }

        $this->command?->info(sprintf(
            'Driver demo ready: 30 rental drivers (%s-##). Created %d, updated %d. Total drivers now %d.',
            self::LICENSE_PREFIX,
            $created,
            $updated,
            Driver::query()->count(),
        ));
    }

    public function isInstalled(): bool
    {
        if (! class_exists(Driver::class) || ! Schema::hasTable('drivers')) {
            return false;
        }

        return Driver::query()->where('notes', 'like', '%'.self::TAG.'%')->exists();
    }

    public function uninstall(): void
    {
        if (! class_exists(Driver::class) || ! Schema::hasTable('drivers')) {
            return;
        }

        $driverIds = Driver::query()
            ->where('notes', 'like', '%'.self::TAG.'%')
            ->pluck('id')
            ->all();

        if (empty($driverIds)) {
            return;
        }

        // Clean up linked documents
        if (class_exists(Document::class) && Schema::hasTable('documents')) {
            Document::query()
                ->where('documentable_type', 'driver')
                ->whereIn('documentable_id', $driverIds)
                ->forceDelete();
        }

        // Clean up provisioned demo user accounts
        $userIds = Driver::query()
            ->whereIn('id', $driverIds)
            ->whereNotNull('user_id')
            ->pluck('user_id')
            ->all();

        $deleted = Driver::query()
            ->whereIn('id', $driverIds)
            ->delete();

        if (! empty($userIds) && class_exists(User::class) && Schema::hasTable('users')) {
            User::query()->whereIn('id', $userIds)->delete();
        }

        $this->command?->info("Driver demo data removed ({$deleted} drivers).");
    }

    private function resolveDriverRole(): ?Role
    {
        if (! class_exists(Role::class) || ! Schema::hasTable('roles')) {
            return null;
        }

        return Role::query()->firstOrCreate(
            ['slug' => 'driver'],
            [
                'name' => 'Driver',
                'description' => 'Mobile delivery & rental driver — POD only',
                'is_system' => true,
                'dashboard_path' => '/module/driver/today',
            ],
        );
    }

    private function resolveDriverUser(string $name, string $slug, ?Role $role): ?int
    {
        if (! class_exists(User::class) || ! Schema::hasTable('users')) {
            return null;
        }

        $email = $slug.'.demo@example.test';
        $username = 'driver.'.str_replace('.', '', $slug);

        /** @var User $user */
        $user = User::query()->firstOrCreate(
            ['email' => $email],
            [
                'name' => $name,
                'username' => $username,
                'password' => Hash::make('password'),
            ],
        );

        if ($role !== null && method_exists($user, 'assignRole') && ! $user->hasRole($role->slug)) {
            $user->assignRole($role);
        }

        return $user->id;
    }

    private function seedDemoDocuments(Driver $driver, int $index, ?int $uploaderId): void
    {
        if (! class_exists(Document::class) || ! Schema::hasTable('documents') || ! Schema::hasTable('document_types') || $uploaderId === null) {
            return;
        }

        $driverTypes = DocumentType::query()
            ->where('entity_type', DocumentType::ENTITY_DRIVER)
            ->get()
            ->keyBy('key');

        if ($driverTypes->isEmpty()) {
            return;
        }

        // KTP for all drivers
        if ($ktpType = $driverTypes->get('ktp')) {
            Document::query()->updateOrCreate(
                [
                    'documentable_type' => 'driver',
                    'documentable_id' => $driver->id,
                    'document_type_id' => $ktpType->id,
                ],
                [
                    'document_number' => sprintf('3271%04d%08d', 1985 + ($index % 15), 1000 + $index),
                    'issued_at' => now()->subYears(3)->toDateString(),
                    'expires_at' => now()->addYears(2)->toDateString(),
                    'uploaded_by' => $uploaderId,
                    'verified_by' => $uploaderId,
                    'verified_at' => now()->subMonths(1),
                    'notes' => 'Demo KTP ['.self::TAG.']',
                ],
            );
        }

        // SIM (sim_a or sim_b1 matching driver's license type)
        $simKey = str_starts_with(strtoupper($driver->license_type ?? ''), 'B1') ? 'sim_b1' : 'sim_a';
        if ($simType = $driverTypes->get($simKey)) {
            $simExpiry = match ($index) {
                29 => now()->subDays(15)->toDateString(),
                27 => now()->addDays(12)->toDateString(),
                28 => now()->addDays(25)->toDateString(),
                default => now()->addMonths(8 + ($index % 24))->toDateString(),
            };

            Document::query()->updateOrCreate(
                [
                    'documentable_type' => 'driver',
                    'documentable_id' => $driver->id,
                    'document_type_id' => $simType->id,
                ],
                [
                    'document_number' => $driver->license_number,
                    'issued_at' => now()->subYears(2)->toDateString(),
                    'expires_at' => $simExpiry,
                    'uploaded_by' => $uploaderId,
                    'verified_by' => $uploaderId,
                    'verified_at' => now()->subMonths(1),
                    'notes' => 'Demo SIM ['.self::TAG.']',
                ],
            );
        }

        // SKCK for first 15 active drivers
        if ($index <= 15 && ($skckType = $driverTypes->get('skck'))) {
            Document::query()->updateOrCreate(
                [
                    'documentable_type' => 'driver',
                    'documentable_id' => $driver->id,
                    'document_type_id' => $skckType->id,
                ],
                [
                    'document_number' => sprintf('SKCK/POLRES/%04d/2026', 100 + $index),
                    'issued_at' => now()->subMonths(3)->toDateString(),
                    'expires_at' => now()->addMonths(9)->toDateString(),
                    'uploaded_by' => $uploaderId,
                    'verified_by' => $uploaderId,
                    'verified_at' => now()->subMonths(1),
                    'notes' => 'Demo SKCK ['.self::TAG.']',
                ],
            );
        }
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function definitions(?Role $driverRole = null): array
    {
        $names = [
            'Agus Setiawan',
            'Bambang Wijaya',
            'Candra Kusuma',
            'Dedi Hermawan',
            'Eko Prasetyo',
            'Fajar Nugroho',
            'Gunawan Saputra',
            'Hendra Gunawan',
            'Irfan Maulana',
            'Joko Santoso',
            'Kurniawan Putra',
            'Lukman Hakim',
            'Muhammad Rizki',
            'Nanda Pratama',
            'Oki Firmansyah',
            'Putra Ramadhan',
            'Rudi Hartono',
            'Surya Aditya',
            'Taufik Hidayat',
            'Ujang Soleh',
            'Vino Setiadi',
            'Wahyu Kurnia',
            'Yudi Permana',
            'Zaki Abdullah',
            'Arief Rahman',
            'Budi Santoso',
            'Deni Kurniawan',
            'Farhan Malik',
            'Gilang Saputra',
            'Hadi Wijaya',
        ];

        // Licenses for passenger rental vehicles & minibuses: SIM A, A Umum, B1, B1 Umum (no heavy B2)
        $licenseTypes = [
            'A', 'A Umum', 'A', 'B1', 'A',
            'A Umum', 'B1 Umum', 'A', 'A Umum', 'B1',
            'A', 'A Umum', 'B1', 'A', 'A Umum',
            'B1 Umum', 'A', 'A', 'A Umum', 'B1',
            'A', 'A Umum', 'B1', 'A', 'A Umum',
            'B1 Umum', 'A', 'A', 'B1', 'A',
        ];

        /** @var array<int, string> $statuses */
        $statuses = [
            21 => Driver::STATUS_ON_TRIP,
            22 => Driver::STATUS_ON_TRIP,
            23 => Driver::STATUS_ON_TRIP,
            24 => Driver::STATUS_ON_TRIP,
            25 => Driver::STATUS_ON_TRIP,
            26 => Driver::STATUS_OFF_DUTY,
            27 => Driver::STATUS_OFF_DUTY,
            28 => Driver::STATUS_OFF_DUTY,
            29 => Driver::STATUS_INACTIVE,
            30 => Driver::STATUS_INACTIVE,
        ];

        $defs = [];

        for ($i = 1; $i <= 30; $i++) {
            $name = $names[$i - 1];
            $slug = strtolower(str_replace(' ', '.', $name));
            $licenseType = $licenseTypes[($i - 1) % count($licenseTypes)];
            $status = $statuses[$i] ?? Driver::STATUS_AVAILABLE;

            // Provision login account for first 5 drivers to enable Driver Portal testing
            $userId = $i <= 5 ? $this->resolveDriverUser($name, $slug, $driverRole) : null;

            $defs[] = [
                'license_number' => sprintf('%s-%02d', self::LICENSE_PREFIX, $i),
                'name' => $name,
                'license_type' => $licenseType,
                'license_expires_at' => now()->addMonths(6 + ($i % 30))->toDateString(),
                'phone' => sprintf('08123456%04d', 7000 + $i),
                'email' => $slug.'.demo@example.test',
                'user_id' => $userId,
                'status' => $status,
                'photo_url' => sprintf('https://ui-avatars.com/api/?name=%s&background=0284c7&color=fff', urlencode($name)),
                'notes' => 'Demo driver seed ['.self::TAG.']',
            ];
        }

        return $defs;
    }
}
