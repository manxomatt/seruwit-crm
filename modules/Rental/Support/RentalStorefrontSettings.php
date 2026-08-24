<?php

namespace Modules\Rental\Support;

use App\Models\Setting;

/**
 * Storefront Theme Layer: the tenant-configurable brand identity shared by the
 * public rental storefront (React) and the GrapesJS-rendered public pages.
 * Replaces the hardcoded values previously baked into
 * PublicRentalBookingController::brand().
 */
class RentalStorefrontSettings
{
    public const GROUP = 'rental_storefront';

    public const DEFAULT_PRIMARY_COLOR = '#0f766e';

    public const DEFAULT_SECONDARY_COLOR = '#0f172a';

    public const KEY_BRAND_NAME = 'rental.storefront.brand_name';

    public const KEY_PRIMARY_COLOR = 'rental.storefront.primary_color';

    public const KEY_SECONDARY_COLOR = 'rental.storefront.secondary_color';

    public const KEY_SUPPORT_PHONE = 'rental.storefront.support_phone';

    public const KEY_LOGO_URL = 'rental.storefront.logo_url';

    public const KEY_HERO_TITLE = 'rental.storefront.hero_title';

    public const KEY_HERO_SUBTITLE = 'rental.storefront.hero_subtitle';

    public const KEY_HERO_IMAGE_URL = 'rental.storefront.hero_image_url';

    public const KEY_SOCIAL_INSTAGRAM = 'rental.storefront.social_instagram';

    public const KEY_SOCIAL_FACEBOOK = 'rental.storefront.social_facebook';

    public const KEY_SOCIAL_TIKTOK = 'rental.storefront.social_tiktok';

    public const KEY_BUSINESS_HOURS = 'rental.storefront.business_hours';

    /**
     * @return array{
     *     brand_name: string,
     *     primary_color: string,
     *     secondary_color: string,
     *     support_phone: string,
     *     logo_url: string,
     *     hero_title: string,
     *     hero_subtitle: string,
     *     hero_image_url: string,
     *     social_instagram: string,
     *     social_facebook: string,
     *     social_tiktok: string,
     *     business_hours: string
     * }
     */
    public static function all(): array
    {
        return [
            'brand_name' => (string) Setting::getValue(self::KEY_BRAND_NAME, ''),
            'primary_color' => (string) Setting::getValue(self::KEY_PRIMARY_COLOR, self::DEFAULT_PRIMARY_COLOR),
            'secondary_color' => (string) Setting::getValue(self::KEY_SECONDARY_COLOR, self::DEFAULT_SECONDARY_COLOR),
            'support_phone' => (string) Setting::getValue(self::KEY_SUPPORT_PHONE, ''),
            'logo_url' => (string) Setting::getValue(self::KEY_LOGO_URL, ''),
            'hero_title' => (string) Setting::getValue(self::KEY_HERO_TITLE, ''),
            'hero_subtitle' => (string) Setting::getValue(self::KEY_HERO_SUBTITLE, ''),
            'hero_image_url' => (string) Setting::getValue(self::KEY_HERO_IMAGE_URL, ''),
            'social_instagram' => (string) Setting::getValue(self::KEY_SOCIAL_INSTAGRAM, ''),
            'social_facebook' => (string) Setting::getValue(self::KEY_SOCIAL_FACEBOOK, ''),
            'social_tiktok' => (string) Setting::getValue(self::KEY_SOCIAL_TIKTOK, ''),
            'business_hours' => (string) Setting::getValue(self::KEY_BUSINESS_HOURS, ''),
        ];
    }

    /**
     * @param  array{
     *     brand_name?: string|null,
     *     primary_color: string,
     *     secondary_color: string,
     *     support_phone?: string|null,
     *     logo_url?: string|null,
     *     hero_title?: string|null,
     *     hero_subtitle?: string|null,
     *     hero_image_url?: string|null,
     *     social_instagram?: string|null,
     *     social_facebook?: string|null,
     *     social_tiktok?: string|null,
     *     business_hours?: string|null
     * }  $data
     */
    public static function update(array $data): void
    {
        self::put(self::KEY_BRAND_NAME, (string) ($data['brand_name'] ?? ''), 'string', 'Storefront brand name', 1);
        self::put(self::KEY_PRIMARY_COLOR, (string) $data['primary_color'], 'string', 'Storefront primary color', 2);
        self::put(self::KEY_SECONDARY_COLOR, (string) $data['secondary_color'], 'string', 'Storefront secondary color', 3);
        self::put(self::KEY_SUPPORT_PHONE, (string) ($data['support_phone'] ?? ''), 'string', 'Storefront support / WhatsApp number', 4);
        self::put(self::KEY_LOGO_URL, (string) ($data['logo_url'] ?? ''), 'string', 'Storefront logo URL', 5);
        self::put(self::KEY_HERO_TITLE, (string) ($data['hero_title'] ?? ''), 'string', 'Storefront hero title', 6);
        self::put(self::KEY_HERO_SUBTITLE, (string) ($data['hero_subtitle'] ?? ''), 'string', 'Storefront hero subtitle', 7);
        self::put(self::KEY_HERO_IMAGE_URL, (string) ($data['hero_image_url'] ?? ''), 'string', 'Storefront hero image URL', 8);
        self::put(self::KEY_SOCIAL_INSTAGRAM, (string) ($data['social_instagram'] ?? ''), 'string', 'Storefront Instagram URL', 9);
        self::put(self::KEY_SOCIAL_FACEBOOK, (string) ($data['social_facebook'] ?? ''), 'string', 'Storefront Facebook URL', 10);
        self::put(self::KEY_SOCIAL_TIKTOK, (string) ($data['social_tiktok'] ?? ''), 'string', 'Storefront TikTok URL', 11);
        self::put(self::KEY_BUSINESS_HOURS, (string) ($data['business_hours'] ?? ''), 'string', 'Storefront business hours', 12);
    }

    private static function put(string $key, string $value, string $type, string $label, int $sortOrder): void
    {
        Setting::query()->updateOrCreate(
            ['key' => $key],
            [
                'group' => self::GROUP,
                'value' => $value,
                'type' => $type,
                'label' => $label,
                'description' => 'Managed via Rental → Settings → Storefront.',
                'is_public' => false,
                'sort_order' => $sortOrder,
            ],
        );
    }
}
