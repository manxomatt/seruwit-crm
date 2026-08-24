<?php

namespace Modules\Rental\Support;

use App\Models\Setting;

/**
 * Curated storefront testimonials, stored as a JSON list in a single setting
 * (no dedicated table) so the tenant can manage social proof from Rental →
 * Settings → Testimoni. Rendered publicly via the <rental-reviews> Bridge
 * Block (see RentalStorefrontBlocks).
 */
class RentalTestimonials
{
    public const GROUP = 'rental_storefront';

    public const KEY = 'rental.storefront.testimonials';

    /**
     * @return list<array{author: string, location: string|null, rating: int, body: string, published: bool}>
     */
    public static function all(): array
    {
        $raw = Setting::getValue(self::KEY, '[]');
        $items = is_array($raw) ? $raw : json_decode((string) $raw, true);

        if (! is_array($items)) {
            return [];
        }

        return array_values(array_map(static fn (array $item): array => [
            'author' => (string) ($item['author'] ?? ''),
            'location' => isset($item['location']) && $item['location'] !== '' ? (string) $item['location'] : null,
            'rating' => (int) max(1, min(5, (int) ($item['rating'] ?? 5))),
            'body' => (string) ($item['body'] ?? ''),
            'published' => (bool) ($item['published'] ?? true),
        ], array_filter($items, 'is_array')));
    }

    /**
     * @return list<array{author: string, location: string|null, rating: int, body: string, published: bool}>
     */
    public static function published(): array
    {
        return array_values(array_filter(
            self::all(),
            static fn (array $item): bool => $item['published'] && $item['author'] !== '' && $item['body'] !== '',
        ));
    }

    /**
     * @param  array<int, array<string, mixed>>  $items
     */
    public static function save(array $items): void
    {
        $clean = array_values(array_map(static fn (array $item): array => [
            'author' => trim((string) ($item['author'] ?? '')),
            'location' => trim((string) ($item['location'] ?? '')),
            'rating' => (int) max(1, min(5, (int) ($item['rating'] ?? 5))),
            'body' => trim((string) ($item['body'] ?? '')),
            'published' => (bool) ($item['published'] ?? true),
        ], $items));

        Setting::query()->updateOrCreate(
            ['key' => self::KEY],
            [
                'group' => self::GROUP,
                'value' => json_encode($clean, JSON_UNESCAPED_UNICODE),
                'type' => 'json',
                'label' => 'Storefront testimonials',
                'description' => 'Managed via Rental → Settings → Testimoni.',
                'is_public' => false,
                'sort_order' => 40,
            ],
        );
    }
}
