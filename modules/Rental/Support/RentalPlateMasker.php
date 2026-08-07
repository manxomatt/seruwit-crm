<?php

namespace Modules\Rental\Support;

use App\Models\Setting;

/**
 * Masks vehicle plate numbers on public rental surfaces.
 */
class RentalPlateMasker
{
    public const SETTING_PUBLIC_MASK_PLATES = 'rental.public_mask_plates';

    public static function enabled(): bool
    {
        return Setting::getValue(self::SETTING_PUBLIC_MASK_PLATES, '1') === '1';
    }

    /**
     * Indonesian-friendly mask: keep region code + suffix, hide middle digits.
     * Examples: "B 1234 XYZ" → "B **** XYZ", "B1234XYZ" → "B **** XYZ".
     */
    public static function mask(?string $plate, bool $force = false): string
    {
        $raw = trim((string) $plate);

        if ($raw === '') {
            return '';
        }

        if (! $force && ! self::enabled()) {
            return $raw;
        }

        $normalized = strtoupper((string) preg_replace('/\s+/', ' ', $raw));
        $parts = array_values(array_filter(explode(' ', $normalized), fn (string $part): bool => $part !== ''));

        if (count($parts) >= 3) {
            return $parts[0].' **** '.$parts[count($parts) - 1];
        }

        if (count($parts) === 2) {
            $left = $parts[0];
            $right = $parts[1];

            if (strlen($right) >= 3) {
                return $left.' **** '.substr($right, -3);
            }

            return $left.' **** '.$right;
        }

        $compact = preg_replace('/\s+/', '', $normalized) ?? $normalized;

        if (strlen($compact) < 5) {
            return $compact;
        }

        $prefixLen = preg_match('/^[A-Z]{1,2}/', $compact, $match) === 1 ? strlen($match[0]) : 1;
        $suffixLen = min(3, strlen($compact) - $prefixLen);

        return substr($compact, 0, $prefixLen).' **** '.substr($compact, -$suffixLen);
    }
}
