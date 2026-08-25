<?php

namespace App\Support;

use App\Models\PlatformSetting;
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

        if (in_array($value, self::values(), true)) {
            return $value;
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
            $value = PlatformSetting::getValue(self::KEY);

            return is_string($value) ? $value : null;
        } catch (Throwable) {
            return null;
        }
    }
}
