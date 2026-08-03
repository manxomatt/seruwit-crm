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
 */
class DemoDatasets
{
    public const PARTNER_INDUSTRIES = 'partner_industries';

    public const PARTNERS = 'partners';

    /**
     * @return array<string, array{label: string, description: string, seeder: class-string, includes?: list<string>}>
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
        ];
    }

    /**
     * @return array{label: string, description: string, seeder: class-string, includes?: list<string>}|null
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
