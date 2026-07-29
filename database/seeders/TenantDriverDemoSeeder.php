<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Schema;
use Modules\Fleet\Models\Driver;

/**
 * Seeds 30 demo fleet drivers.
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

        foreach ($this->definitions() as $def) {
            $license = $def['license_number'];
            unset($def['license_number']);

            $driver = Driver::query()->updateOrCreate(
                ['license_number' => $license],
                $def,
            );

            if ($driver->wasRecentlyCreated) {
                $created++;
            } else {
                $updated++;
            }
        }

        $this->command?->info(sprintf(
            'Driver demo ready: 30 licenses (%s-##). Created %d, updated %d. Total drivers now %d.',
            self::LICENSE_PREFIX,
            $created,
            $updated,
            Driver::query()->count(),
        ));
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function definitions(): array
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

        $licenseTypes = ['B2', 'B1', 'B2', 'B2', 'A', 'B2', 'B1', 'B2', 'B2', 'B1'];

        /** @var array<int, string> $statuses */
        $statuses = [
            26 => Driver::STATUS_ON_LEAVE,
            27 => Driver::STATUS_ON_LEAVE,
            28 => Driver::STATUS_ON_LEAVE,
            29 => Driver::STATUS_INACTIVE,
            30 => Driver::STATUS_INACTIVE,
        ];

        $defs = [];

        for ($i = 1; $i <= 30; $i++) {
            $name = $names[$i - 1];
            $slug = strtolower(str_replace(' ', '.', $name));
            $licenseType = $licenseTypes[($i - 1) % count($licenseTypes)];
            $status = $statuses[$i] ?? Driver::STATUS_AVAILABLE;

            $defs[] = [
                'license_number' => sprintf('%s-%02d', self::LICENSE_PREFIX, $i),
                'name' => $name,
                'license_type' => $licenseType,
                'license_expires_at' => now()->addMonths(6 + ($i % 30))->toDateString(),
                'phone' => sprintf('08123456%04d', 7000 + $i),
                'email' => $slug.'.demo@example.test',
                'status' => $status,
                'notes' => 'Demo driver seed ['.self::TAG.']',
            ];
        }

        return $defs;
    }
}
