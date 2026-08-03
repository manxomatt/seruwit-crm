<?php

namespace App\Modules;

/**
 * Named module bundles for vertical go-to-market (one-click install).
 */
class VerticalPacks
{
    public const RENTAL_MOBIL = 'rental_mobil';

    public const TRAVEL_SHUTTLE = 'travel_shuttle';

    public const FINANCE = 'finance';

    public const PARTNER_INDUSTRIES = 'partner_industries';

    /**
     * @return array<string, array{label: string, description: string, modules: list<string>, seeders: list<class-string>}>
     */
    public static function all(): array
    {
        return [
            self::RENTAL_MOBIL => [
                'label' => 'Rental Mobil',
                'description' => 'Fleet, documents, maintenance, tracking, invoicing, receivables, rental + demo data.',
                'modules' => [
                    'fleet',
                    'document',
                    'maintenance',
                    'tracking',
                    'invoicing',
                    'receivables',
                    'rental',
                ],
                'seeders' => [
                    \Database\Seeders\TenantRentalDemoSeeder::class,
                ],
            ],
            self::TRAVEL_SHUTTLE => [
                'label' => 'Travel Shuttle',
                'description' => 'Fleet, documents, maintenance, tracking, invoicing, receivables, shuttle travel + demo data.',
                'modules' => [
                    'fleet',
                    'document',
                    'maintenance',
                    'tracking',
                    'invoicing',
                    'receivables',
                    'shuttle',
                ],
                'seeders' => [
                    \Database\Seeders\TenantShuttleDemoSeeder::class,
                ],
            ],
            self::FINANCE => [
                'label' => 'Finance Suite',
                'description' => 'Accounting (core), invoicing, receivables, purchasing, payables, billing + demo data. Billing also brings orders/transportation/fleet.',
                'modules' => [
                    'invoicing',
                    'receivables',
                    'purchasing',
                    'payables',
                    'billing',
                ],
                'seeders' => [
                    \Database\Seeders\TenantFinanceDemoSeeder::class,
                    \Database\Seeders\TenantPayablesDemoSeeder::class,
                ],
            ],
            self::PARTNER_INDUSTRIES => [
                'label' => 'Partner Industries',
                'description' => 'Seeds common ERP/CRM industry masters (ID/EN) for classifying partners. Partners is a core feature — this pack only installs master data.',
                // Partners is core (not installable). This pack is seed-only.
                'modules' => [],
                'seeders' => [
                    \Database\Seeders\TenantPartnerIndustriesSeeder::class,
                ],
            ],
        ];
    }

    /**
     * @return array{label: string, description: string, modules: list<string>, seeders: list<class-string>}|null
     */
    public static function find(string $key): ?array
    {
        return self::all()[$key] ?? null;
    }

    /**
     * Whether a pack appears installed for the current tenant.
     * Module packs: any listed optional module is installed.
     * Seed-only packs: first seeder with isInstalled() reports true.
     */
    public static function isInstalled(string $key): bool
    {
        $pack = self::find($key);

        if ($pack === null) {
            return false;
        }

        if ($pack['modules'] !== []) {
            return collect($pack['modules'])->contains(
                fn (string $moduleKey): bool => \App\Modules\Facades\Modules::installed($moduleKey)
            );
        }

        foreach ($pack['seeders'] as $seederClass) {
            if (! class_exists($seederClass)) {
                continue;
            }

            $seeder = app($seederClass);

            if (method_exists($seeder, 'isInstalled')) {
                return (bool) $seeder->isInstalled();
            }
        }

        return false;
    }
}
