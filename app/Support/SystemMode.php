<?php

namespace App\Support;

use App\Models\PlatformSetting;
use App\Models\Setting;
use App\Models\Tenant;
use InvalidArgumentException;
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

    /**
     * Transition the platform system mode and synchronize dependent state.
     *
     * When moving to production:
     * - Persists the mode to central `platform_settings` (and updates any legacy shadow row in `settings`).
     * - Purges development debug session artifacts (`dev_verification_url`, `dev_reset_url`, `debug_otp`).
     * - Revokes `can_install_demo_data` on existing tenants so development demo flags do not remain active.
     */
    public static function transitionTo(string $mode): void
    {
        $normalized = strtolower(trim($mode));

        if (! in_array($normalized, self::values(), true)) {
            throw new InvalidArgumentException("Invalid system mode [{$mode}].");
        }

        PlatformSetting::setValue(self::KEY, $normalized);

        try {
            if ((! function_exists('tenancy') || ! tenancy()->initialized) && class_exists(Setting::class)) {
                Setting::query()->where('key', self::KEY)->update(['value' => $normalized]);
            }
        } catch (Throwable) {
            // Ignore when settings table is not yet migrated
        }

        if ($normalized === self::PRODUCTION) {
            try {
                if (function_exists('session') && session()->isStarted()) {
                    session()->forget(['dev_verification_url', 'dev_reset_url', 'debug_otp']);
                }
            } catch (Throwable) {
                // Ignore outside HTTP session context
            }

            try {
                if (class_exists(Tenant::class)) {
                    Tenant::query()->get()->each(function (Tenant $tenant): void {
                        if ($tenant->canInstallDemoData()) {
                            $tenant->update(['can_install_demo_data' => false]);
                        }
                    });
                }
            } catch (Throwable) {
                // Ignore when tenants table is unavailable
            }
        }
    }

    /**
     * Inspect central configuration for missing production dependencies (SMTP, WhatsApp Gateway).
     *
     * @return list<string>
     */
    public static function productionReadinessIssues(): array
    {
        $issues = [];

        try {
            $smtpHost = PlatformSetting::getValue('email.smtp_host');
            if (blank($smtpHost)) {
                $issues[] = 'SMTP Central belum dikonfigurasi (email.smtp_host kosong). Email verifikasi & reset password tidak akan terkirim di mode Production.';
            }

            $requirePhoneVerification = filter_var(
                PlatformSetting::getValue('whatsapp.require_phone_verification', '0'),
                FILTER_VALIDATE_BOOLEAN
            );

            if ($requirePhoneVerification && ! PlatformSetting::isWhatsAppEnabled()) {
                $issues[] = 'Verifikasi Nomor WhatsApp wajib (whatsapp.require_phone_verification aktif), namun Gateway WhatsApp Central masih nonaktif (whatsapp.is_enabled = false).';
            }
        } catch (Throwable) {
            // Ignore when platform_settings table is not ready
        }

        return $issues;
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
