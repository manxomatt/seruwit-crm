<?php

namespace App\Support;

use App\Models\PlatformSetting;
use Throwable;

final class CentralAiSettings
{
    public const KEY = 'general.ai_features_enabled';

    public const KEY_OCR = 'general.ai_ocr_enabled';

    /**
     * Determine if AI features are enabled at the platform / central admin level.
     */
    public static function isEnabled(): bool
    {
        $value = self::storedValue(self::KEY);

        if ($value === null) {
            return true;
        }

        return filter_var($value, FILTER_VALIDATE_BOOLEAN);
    }

    /**
     * Determine if AI OCR Document features (KTP/SIM) are enabled at the platform level.
     */
    public static function isOcrEnabled(): bool
    {
        if (! self::isEnabled()) {
            return false;
        }

        $value = self::storedValue(self::KEY_OCR);

        if ($value === null) {
            return true;
        }

        return filter_var($value, FILTER_VALIDATE_BOOLEAN);
    }

    /**
     * Read the platform-global value from the central platform_settings table.
     */
    private static function storedValue(string $key): ?string
    {
        try {
            $value = PlatformSetting::getValue($key);

            return is_string($value) ? $value : null;
        } catch (Throwable) {
            return null;
        }
    }
}
