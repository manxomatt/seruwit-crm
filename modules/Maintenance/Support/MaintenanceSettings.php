<?php

namespace Modules\Maintenance\Support;

use App\Models\Setting;

/**
 * Typed accessors for maintenance shop-floor settings with safe defaults.
 */
class MaintenanceSettings
{
    public static function alertKmBefore(): int
    {
        return max(0, (int) Setting::getValue('maintenance.alert_km_before', 500));
    }

    public static function alertDaysBefore(): int
    {
        return max(0, (int) Setting::getValue('maintenance.alert_days_before', 14));
    }

    public static function autoCreateWo(): bool
    {
        return self::truthy(Setting::getValue('maintenance.auto_create_wo', '0'));
    }

    public static function singleActiveWoPerVehicle(): bool
    {
        return self::truthy(Setting::getValue('maintenance.single_active_wo_per_vehicle', '1'));
    }

    public static function singleActiveWoPerBay(): bool
    {
        return self::truthy(Setting::getValue('maintenance.single_active_wo_per_bay', '1'));
    }

    private static function truthy(mixed $value): bool
    {
        return in_array((string) $value, ['1', 'true', 'on', 'yes'], true);
    }
}
