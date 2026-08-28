<?php

namespace App\Support;

use App\Models\PlatformSetting;
use App\Models\Setting;
use Throwable;

/**
 * Platform-wide development vs production behaviour.
 *
 * Stored in the central platform_settings table so tenant context (OTP, mail)
 * always reads the same toggle. Development disables outbound mail, surfaces OTP /
 * email-verification secrets on screen, and auto-allows demo data install on
 * newly provisioned workspaces.
 */
final class SystemMode
{
    public const KEY = 'general.system_mode';

    public const DEVELOPMENT = 'development';

    public const PRODUCTION = 'production';

    /**
     * @return list<string>
     */
    public static function values(): array
    {
        return [self::DEVELOPMENT, self::PRODUCTION];
    }

    public static function current(): string
    {
        $value = self::storedValue();

        if (is_string($value)) {
            $normalized = strtolower(trim($value));
            if (in_array($normalized, self::values(), true)) {
                return $normalized;
            }
        }

        return app()->environment('production')
            ? self::PRODUCTION
            : self::DEVELOPMENT;
    }

    public static function isDevelopment(): bool
    {
        return self::current() === self::DEVELOPMENT;
    }

    public static function isProduction(): bool
    {
        return self::current() === self::PRODUCTION;
    }

    public static function shouldSendMail(): bool
    {
        return self::isProduction();
    }

    public static function shouldExposeDebugOtp(): bool
    {
        return self::isDevelopment();
    }

    private static function storedValue(): ?string
    {
        try {
            if (class_exists(PlatformSetting::class)) {
                $value = PlatformSetting::getValue(self::KEY);
                if (is_string($value) && in_array(strtolower(trim($value)), self::values(), true)) {
                    return strtolower(trim($value));
                }
            }
        } catch (Throwable) {
            // Fall through to Setting query
        }

        try {
            if (class_exists(Setting::class)) {
                $settingValue = Setting::query()->where('key', self::KEY)->value('value');
                if (is_string($settingValue) && in_array(strtolower(trim($settingValue)), self::values(), true)) {
                    return strtolower(trim($settingValue));
                }
            }
        } catch (Throwable) {
            // Fall through to DB fallback
        }

        try {
            $dbVal = \Illuminate\Support\Facades\DB::table('platform_settings')->where('key', self::KEY)->value('value')
                ?? \Illuminate\Support\Facades\DB::table('settings')->where('key', self::KEY)->value('value');

            if (is_string($dbVal) && in_array(strtolower(trim($dbVal)), self::values(), true)) {
                return strtolower(trim($dbVal));
            }
        } catch (Throwable) {
            // Ignore
        }

        return null;
    }
}
