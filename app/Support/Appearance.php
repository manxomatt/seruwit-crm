<?php

namespace App\Support;

/**
 * Resolves and sanitizes Appearance settings for CSS variables / theme chrome.
 */
class Appearance
{
    public const DEFAULT_PRIMARY = '#3B82F6';

    public const DEFAULT_SECONDARY = '#10B981';

    public const DEFAULT_FONT = 'Figtree, ui-sans-serif, system-ui, sans-serif';

    /**
     * @return array{
     *     primary_color: string,
     *     secondary_color: string,
     *     font_family: string,
     *     dark_mode: bool,
     *     custom_css: string,
     *     custom_js: string
     * }
     */
    public static function resolve(): array
    {
        return [
            'primary_color' => self::sanitizeColor((string) (\App\Models\Setting::getValue('appearance.primary_color', self::DEFAULT_PRIMARY) ?? self::DEFAULT_PRIMARY)),
            'secondary_color' => self::sanitizeColor((string) (\App\Models\Setting::getValue('appearance.secondary_color', self::DEFAULT_SECONDARY) ?? self::DEFAULT_SECONDARY)),
            'font_family' => self::sanitizeFont((string) (\App\Models\Setting::getValue('appearance.font_family', self::DEFAULT_FONT) ?? self::DEFAULT_FONT)),
            'dark_mode' => self::truthy(\App\Models\Setting::getValue('appearance.dark_mode', '0')),
            'custom_css' => (string) (\App\Models\Setting::getValue('appearance.custom_css', '') ?? ''),
            'custom_js' => (string) (\App\Models\Setting::getValue('appearance.custom_js', '') ?? ''),
        ];
    }

    /**
     * CSS custom properties for :root (hex + RGB triplets for Tailwind alpha).
     *
     * @return array<string, string>
     */
    public static function cssVariables(?array $appearance = null): array
    {
        $appearance ??= self::resolve();
        $primary = $appearance['primary_color'];
        $secondary = $appearance['secondary_color'];
        $primaryRgb = self::hexToRgb($primary) ?? self::hexToRgb(self::DEFAULT_PRIMARY);
        $secondaryRgb = self::hexToRgb($secondary) ?? self::hexToRgb(self::DEFAULT_SECONDARY);
        $primaryDark = self::mixHex($primary, '#0f172a', 0.55);
        $primaryDarker = self::mixHex($primary, '#020617', 0.72);

        return [
            '--color-primary' => $primary,
            '--color-primary-rgb' => $primaryRgb ? "{$primaryRgb['r']} {$primaryRgb['g']} {$primaryRgb['b']}" : '59 130 246',
            '--color-secondary' => $secondary,
            '--color-secondary-rgb' => $secondaryRgb ? "{$secondaryRgb['r']} {$secondaryRgb['g']} {$secondaryRgb['b']}" : '16 185 129',
            '--color-primary-dark' => $primaryDark,
            '--color-primary-darker' => $primaryDarker,
            '--font-sans' => $appearance['font_family'],
            '--brand-sidebar-from' => $primaryDarker,
            '--brand-sidebar-via' => $primaryDark,
            '--brand-sidebar-to' => $primaryDarker,
            '--brand-sidebar-accent' => $secondary,
        ];
    }

    public static function cssVariablesBlock(?array $appearance = null): string
    {
        $lines = [];
        foreach (self::cssVariables($appearance) as $property => $value) {
            $lines[] = "{$property}: {$value};";
        }

        return implode(' ', $lines);
    }

    public static function sanitizeColor(string $value): string
    {
        $value = trim($value);
        if (preg_match('/^#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6})$/', $value) === 1) {
            if (strlen($value) === 4) {
                return sprintf('#%s%s%s%s%s%s', $value[1], $value[1], $value[2], $value[2], $value[3], $value[3]);
            }

            return strtoupper($value);
        }

        return self::DEFAULT_PRIMARY;
    }

    public static function sanitizeFont(string $value): string
    {
        $cleaned = preg_replace('/[^\w\s\-,.\'"\/]/', '', $value) ?? '';
        $cleaned = trim($cleaned);

        return $cleaned !== '' ? $cleaned : self::DEFAULT_FONT;
    }

    public static function truthy(mixed $value): bool
    {
        if (is_bool($value)) {
            return $value;
        }

        $normalized = strtolower(trim((string) $value));

        return in_array($normalized, ['1', 'true', 'yes', 'on'], true);
    }

    /**
     * @return array{r: int, g: int, b: int}|null
     */
    public static function hexToRgb(string $hex): ?array
    {
        $hex = ltrim(self::sanitizeColor($hex), '#');
        if (strlen($hex) !== 6) {
            return null;
        }

        return [
            'r' => hexdec(substr($hex, 0, 2)),
            'g' => hexdec(substr($hex, 2, 2)),
            'b' => hexdec(substr($hex, 4, 2)),
        ];
    }

    public static function mixHex(string $hex, string $with, float $ratio): string
    {
        $a = self::hexToRgb($hex);
        $b = self::hexToRgb($with);
        if ($a === null || $b === null) {
            return self::DEFAULT_PRIMARY;
        }

        $ratio = max(0, min(1, $ratio));
        $r = (int) round($a['r'] * (1 - $ratio) + $b['r'] * $ratio);
        $g = (int) round($a['g'] * (1 - $ratio) + $b['g'] * $ratio);
        $bVal = (int) round($a['b'] * (1 - $ratio) + $b['b'] * $ratio);

        return sprintf('#%02X%02X%02X', $r, $g, $bVal);
    }
}
