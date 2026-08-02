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
                'description' => 'Fleet, documents, products, maintenance, tracking, invoicing, rental + demo data.',
                'modules' => [
                    'fleet',
                    'document',
                    'products',
                    'maintenance',
                    'tracking',
                    'invoicing',
                    'rental',
                ],
                'seeders' => [
                    \Database\Seeders\TenantRentalDemoSeeder::class,
                ],
            ],
            self::TRAVEL_SHUTTLE => [
                'label' => 'Travel Shuttle',
                'description' => 'Fleet, invoicing, tracking, documents, maintenance, shuttle travel + demo data.',
                'modules' => [
                    'fleet',
                    'document',
                    'products',
                    'maintenance',
                    'tracking',
                    'invoicing',
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
                'description' => 'Common ERP/CRM industry masters (ID/EN) for classifying partners. Requires Partners.',
                'modules' => [
                    'partners',
                ],
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
}
