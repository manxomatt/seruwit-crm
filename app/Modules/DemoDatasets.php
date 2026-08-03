<?php

namespace App\Modules;

/**
 * Catalog of installable demo datasets for sandbox / training tenants.
 *
 * Unlike VerticalPacks (module bundles), these only seed sample rows and do not
 * install optional modules. Visibility is gated by Tenant::canInstallDemoData().
 */
class DemoDatasets
{
    public const PARTNERS = 'partners';

    /**
     * @return array<string, array{label: string, description: string, seeder: class-string}>
     */
    public static function all(): array
    {
        return [
            self::PARTNERS => [
                'label' => 'Partners demo',
                'description' => 'Sample customers, suppliers, and dual-role partners with industries, tags, and addresses.',
                'seeder' => \Database\Seeders\TenantPartnerDemoSeeder::class,
            ],
        ];
    }

    /**
     * @return array{label: string, description: string, seeder: class-string}|null
     */
    public static function find(string $key): ?array
    {
        return self::all()[$key] ?? null;
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
