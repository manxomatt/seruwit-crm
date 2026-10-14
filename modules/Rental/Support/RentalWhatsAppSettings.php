<?php

namespace Modules\Rental\Support;

use App\Models\Setting;

class RentalWhatsAppSettings
{
    public const GROUP = 'rental_whatsapp';

    public const KEY_IS_ENABLED = 'whatsapp.is_enabled';

    public const KEY_PROVIDER = 'whatsapp.provider';

    public const KEY_FONNTE_TOKEN = 'whatsapp.fonnte_token';

    public const KEY_CUSTOM_URL = 'whatsapp.custom_url';

    public const KEY_CUSTOM_TOKEN = 'whatsapp.custom_token';

    public const KEY_SEND_ON_BOOKING_CONFIRMED = 'whatsapp.send_on_booking_confirmed';

    public const KEY_SEND_ON_CHECKOUT = 'whatsapp.send_on_checkout';

    public const KEY_SEND_ON_RETURN = 'whatsapp.send_on_return';

    /**
     * @return array{
     *     is_enabled: bool,
     *     provider: string,
     *     fonnte_token: string,
     *     custom_url: string,
     *     custom_token: string,
     *     send_on_booking_confirmed: bool,
     *     send_on_checkout: bool,
     *     send_on_return: bool
     * }
     */
    public static function all(): array
    {
        return [
            'is_enabled' => filter_var(Setting::getValue(self::KEY_IS_ENABLED, false), FILTER_VALIDATE_BOOLEAN),
            'provider' => (string) Setting::getValue(self::KEY_PROVIDER, 'fonnte'),
            'fonnte_token' => (string) Setting::getValue(self::KEY_FONNTE_TOKEN, ''),
            'custom_url' => (string) Setting::getValue(self::KEY_CUSTOM_URL, ''),
            'custom_token' => (string) Setting::getValue(self::KEY_CUSTOM_TOKEN, ''),
            'send_on_booking_confirmed' => filter_var(Setting::getValue(self::KEY_SEND_ON_BOOKING_CONFIRMED, true), FILTER_VALIDATE_BOOLEAN),
            'send_on_checkout' => filter_var(Setting::getValue(self::KEY_SEND_ON_CHECKOUT, true), FILTER_VALIDATE_BOOLEAN),
            'send_on_return' => filter_var(Setting::getValue(self::KEY_SEND_ON_RETURN, true), FILTER_VALIDATE_BOOLEAN),
        ];
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public static function update(array $data): void
    {
        self::put(self::KEY_IS_ENABLED, ! empty($data['is_enabled']) ? '1' : '0', 'boolean');
        self::put(self::KEY_PROVIDER, (string) ($data['provider'] ?? 'fonnte'), 'string');
        self::put(self::KEY_FONNTE_TOKEN, (string) ($data['fonnte_token'] ?? ''), 'string');
        self::put(self::KEY_CUSTOM_URL, (string) ($data['custom_url'] ?? ''), 'string');
        self::put(self::KEY_CUSTOM_TOKEN, (string) ($data['custom_token'] ?? ''), 'string');
        self::put(self::KEY_SEND_ON_BOOKING_CONFIRMED, ! empty($data['send_on_booking_confirmed']) ? '1' : '0', 'boolean');
        self::put(self::KEY_SEND_ON_CHECKOUT, ! empty($data['send_on_checkout']) ? '1' : '0', 'boolean');
        self::put(self::KEY_SEND_ON_RETURN, ! empty($data['send_on_return']) ? '1' : '0', 'boolean');
    }

    private static function put(string $key, string $value, string $type): void
    {
        Setting::query()->updateOrCreate(
            ['key' => $key],
            [
                'group' => self::GROUP,
                'value' => $value,
                'type' => $type,
                'label' => ucfirst(str_replace(['whatsapp.', '_'], ['', ' '], $key)),
                'is_public' => false,
            ]
        );
    }
}
