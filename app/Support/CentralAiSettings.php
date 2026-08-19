<?php

namespace App\Support;

use App\Models\Setting;
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
     * Read the central setting value from the central database connection.
     */
    private static function storedValue(): ?string
    {
        try {
            $connection = config('tenancy.database.central_connection');

            $query = $connection ? Setting::on($connection) : Setting::query();

            $value = $query->where('key', self::KEY)->value('value');

            return is_string($value) ? $value : null;
        } catch (Throwable) {
            return null;
        }
    }
}
