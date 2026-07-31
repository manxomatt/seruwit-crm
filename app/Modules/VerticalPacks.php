<?php

namespace App\Modules;

/**
 * Named module bundles for vertical go-to-market (one-click install).
 */
class VerticalPacks
{
    public const RENTAL_MOBIL = 'rental_mobil';

    public const TRAVEL_SHUTTLE = 'travel_shuttle';

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
                    'maintenance',
                    'tracking',
                    'invoicing',
                    'shuttle',
                ],
                'seeders' => [
                    \Database\Seeders\TenantShuttleDemoSeeder::class,
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
