<?php

namespace App\Support;

use App\Models\PlatformSetting;
use Throwable;

final class CentralAiSettings
{
    public const KEY = 'general.ai_features_enabled';

    /**
     * Determine if AI features are enabled at the platform / central admin level.
     */
    public static function isEnabled(): bool
    {
        $value = self::storedValue();

        if ($value === null) {
            return true;
        }

        return filter_var($value, FILTER_VALIDATE_BOOLEAN);
    }

    /**
     * Read the platform-global value from the central platform_settings table.
     */
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
