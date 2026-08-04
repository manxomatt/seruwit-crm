<?php

namespace App\Modules;

/**
 * Catalog of installable demo datasets for sandbox / training tenants.
 *
 * Unlike VerticalPacks (module bundles), these only seed sample rows and do not
 * install optional modules. Visibility is gated by Tenant::canInstallDemoData().
 *
 * Optional `includes` lists other demo keys that install/uninstall with this one
 * (dependencies first on install, reverse on uninstall).
 * Optional `requires_module` gates install on an optional module being available.
 */
class DemoDatasets
{
    public const PARTNER_INDUSTRIES = 'partner_industries';

    public const PARTNERS = 'partners';

    public const VEHICLES = 'vehicles';

    public const FLEET_BASES = 'fleet_bases';

    public const DRIVERS = 'drivers';

    public const FUEL = 'fuel';

    public const DOCUMENTS = 'documents';

    public const MAINTENANCE = 'maintenance';

    /**
     * @return array<string, array{label: string, description: string, seeder: class-string, includes?: list<string>, requires_module?: string}>
     */
    public static function all(): array
    {
        return [
            self::PARTNER_INDUSTRIES => [
                'label' => 'Partner industries',
                'description' => 'Common ERP/CRM industry masters (ID/EN) for classifying partners.',
                'seeder' => \Database\Seeders\TenantPartnerIndustriesSeeder::class,
            ],
            self::PARTNERS => [
                'label' => 'Partners demo',
                'description' => 'Sample customers, suppliers, and dual-role partners with tags and addresses. Also installs Partner industries.',
                'seeder' => \Database\Seeders\TenantPartnerDemoSeeder::class,
                'includes' => [self::PARTNER_INDUSTRIES],
            ],
            self::VEHICLES => [
                'label' => 'Vehicles demo',
                'description' => '30 sample fleet vehicles (trucks, vans, pickups, box) with plates, capacity, and fuel data. Requires Fleet.',
                'seeder' => \Database\Seeders\TenantVehicleDemoSeeder::class,
                'requires_module' => 'fleet',
            ],
            self::FLEET_BASES => [
                'label' => 'Fleet bases demo',
                'description' => '5 sample home bases (depot, yard, satellite, workshop) with PIC, hours, and map coordinates. Assigns Vehicles demo units when present. Requires Fleet.',
                'seeder' => \Database\Seeders\TenantFleetBaseDemoSeeder::class,
                'requires_module' => 'fleet',
            ],
            self::DRIVERS => [
                'label' => 'Drivers demo',
                'description' => '30 sample fleet drivers with licenses, contacts, and availability statuses. Requires Fleet.',
                'seeder' => \Database\Seeders\TenantDriverDemoSeeder::class,
                'requires_module' => 'fleet',
            ],
            self::FUEL => [
                'label' => 'Fuel (BBM) demo',
                'description' => '10 sample fuel fills across vehicles with stations, costs, and km/L. Uses Vehicles demo plates when present. Requires Fleet.',
                'seeder' => \Database\Seeders\TenantFuelDemoSeeder::class,
                'requires_module' => 'fleet',
            ],
            self::DOCUMENTS => [
                'label' => 'Documents demo',
                'description' => 'Compliance docs (STNK, KIR, SIM, etc.) for Vehicles + Drivers demos, including expired/expiring scenarios. Requires Documents (and Fleet).',
                'seeder' => \Database\Seeders\TenantDocumentDemoSeeder::class,
                'requires_module' => 'document',
            ],
            self::MAINTENANCE => [
                'label' => 'Maintenance demo',
                'description' => 'Sample work orders and preventive schedules across fleet vehicles. Requires Maintenance (uses Fleet vehicles when present).',
                'seeder' => \Database\Seeders\TenantMaintenanceDemoSeeder::class,
                'requires_module' => 'maintenance',
            ],
        ];
    }

    /**
     * @return array{label: string, description: string, seeder: class-string, includes?: list<string>, requires_module?: string}|null
     */
    public static function find(string $key): ?array
    {
        return self::all()[$key] ?? null;
    }

    /**
     * @return list<string>
     */
    public static function includes(string $key): array
    {
        return self::find($key)['includes'] ?? [];
    }

    public static function isInstalled(string $key): bool
    {
        $dataset = self::find($key);

        if ($dataset === null || ! class_exists($dataset['seeder'])) {
            return false;
        }

        $seeder = app($dataset['seeder']);

        return method_exists($seeder, 'isInstalled') && (bool) $seeder->isInstalled();
    }
}
