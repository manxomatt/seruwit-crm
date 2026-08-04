<?php

namespace Modules\Tracking\Support;

use App\Models\Setting;
use Carbon\CarbonImmutable;
use DateTimeInterface;

/**
 * Resolves the tenant display timezone from general settings.
 */
class TrackingTimezone
{
    /**
     * The timezone operators expect to see on tracking screens.
     */
    public static function general(): string
    {
        try {
            $timezone = Setting::getValue('general.timezone', config('app.timezone', 'UTC'));
        } catch (\Throwable) {
            $timezone = config('app.timezone', 'UTC');
        }

        if (! is_string($timezone) || $timezone === '') {
            return (string) config('app.timezone', 'UTC');
        }

        if (! in_array($timezone, timezone_identifiers_list(), true)) {
            return (string) config('app.timezone', 'UTC');
        }

        return $timezone;
    }

    /**
     * Format a stored (app-timezone) instant as a naive datetime in the
     * general display timezone, suitable for the map UI helpers.
     */
    public static function formatForDisplay(?DateTimeInterface $value): ?string
    {
        if ($value === null) {
            return null;
        }

        return CarbonImmutable::instance($value)
            ->timezone(self::general())
            ->format('Y-m-d H:i:s');
    }
}
