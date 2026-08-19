<?php

namespace Modules\Maintenance\Support;

use App\Models\Setting;

/**
 * Typed accessors and updates for maintenance shop-floor settings.
 * Edited via Maintenance → Settings (not Modules/Settings).
 */
class MaintenanceSettings
{
    public const KEY_ALERT_KM_BEFORE = 'maintenance.alert_km_before';

    public const KEY_ALERT_DAYS_BEFORE = 'maintenance.alert_days_before';

    public const KEY_AUTO_CREATE_WO = 'maintenance.auto_create_wo';

    public const KEY_SINGLE_ACTIVE_WO_PER_VEHICLE = 'maintenance.single_active_wo_per_vehicle';

    public const KEY_SINGLE_ACTIVE_WO_PER_BAY = 'maintenance.single_active_wo_per_bay';

    public const KEY_AI_PREDICTIVE_MAINTENANCE_ENABLED = 'maintenance.ai_predictive_maintenance_enabled';

    /**
     * @return list<string>
     */
    public static function managedKeys(): array
    {
        return [
            self::KEY_ALERT_KM_BEFORE,
            self::KEY_ALERT_DAYS_BEFORE,
            self::KEY_AUTO_CREATE_WO,
            self::KEY_SINGLE_ACTIVE_WO_PER_VEHICLE,
            self::KEY_SINGLE_ACTIVE_WO_PER_BAY,
            self::KEY_AI_PREDICTIVE_MAINTENANCE_ENABLED,
        ];
    }

    public static function alertKmBefore(): int
    {
        return max(0, (int) Setting::getValue(self::KEY_ALERT_KM_BEFORE, 500));
    }

    public static function alertDaysBefore(): int
    {
        return max(0, (int) Setting::getValue(self::KEY_ALERT_DAYS_BEFORE, 14));
    }

    public static function autoCreateWo(): bool
    {
        return self::truthy(Setting::getValue(self::KEY_AUTO_CREATE_WO, '0'));
    }

    public static function singleActiveWoPerVehicle(): bool
    {
        return self::truthy(Setting::getValue(self::KEY_SINGLE_ACTIVE_WO_PER_VEHICLE, '1'));
    }

    public static function singleActiveWoPerBay(): bool
    {
        return self::truthy(Setting::getValue(self::KEY_SINGLE_ACTIVE_WO_PER_BAY, '1'));
    }

    public static function aiPredictiveMaintenanceEnabled(): bool
    {
        return self::truthy(Setting::getValue(self::KEY_AI_PREDICTIVE_MAINTENANCE_ENABLED, '1'));
    }

    /**
     * @return array{
     *     alert_km_before: string,
     *     alert_days_before: string,
     *     auto_create_wo: bool,
     *     single_active_wo_per_vehicle: bool,
     *     single_active_wo_per_bay: bool,
     *     ai_predictive_maintenance_enabled: bool
     * }
     */
    public static function all(): array
    {
        return [
            'alert_km_before' => (string) self::alertKmBefore(),
            'alert_days_before' => (string) self::alertDaysBefore(),
            'auto_create_wo' => self::autoCreateWo(),
            'single_active_wo_per_vehicle' => self::singleActiveWoPerVehicle(),
            'single_active_wo_per_bay' => self::singleActiveWoPerBay(),
            'ai_predictive_maintenance_enabled' => self::aiPredictiveMaintenanceEnabled(),
        ];
    }

    /**
     * @param  array{
     *     alert_km_before: int|string,
     *     alert_days_before: int|string,
     *     auto_create_wo: bool,
     *     single_active_wo_per_vehicle: bool,
     *     single_active_wo_per_bay: bool,
     *     ai_predictive_maintenance_enabled?: bool
     * }  $data
     */
    public static function update(array $data): void
    {
        self::put(self::KEY_ALERT_KM_BEFORE, (string) max(0, (int) $data['alert_km_before']), 'number', 'Alert km before service', 1);
        self::put(self::KEY_ALERT_DAYS_BEFORE, (string) max(0, (int) $data['alert_days_before']), 'number', 'Alert days before service', 2);
        self::put(self::KEY_AUTO_CREATE_WO, $data['auto_create_wo'] ? '1' : '0', 'boolean', 'Auto-create draft work order', 3);
        self::put(self::KEY_SINGLE_ACTIVE_WO_PER_VEHICLE, $data['single_active_wo_per_vehicle'] ? '1' : '0', 'boolean', 'One in-progress WO per vehicle', 4);
        self::put(self::KEY_SINGLE_ACTIVE_WO_PER_BAY, $data['single_active_wo_per_bay'] ? '1' : '0', 'boolean', 'One in-progress WO per bay', 5);
        self::put(self::KEY_AI_PREDICTIVE_MAINTENANCE_ENABLED, ! empty($data['ai_predictive_maintenance_enabled']) ? '1' : '0', 'boolean', 'AI Predictive Maintenance & Anomaly Detection', 10);
    }

    private static function put(string $key, string $value, string $type, string $label, int $sortOrder): void
    {
        Setting::query()->updateOrCreate(
            ['key' => $key],
            [
                'group' => 'maintenance',
                'value' => $value,
                'type' => $type,
                'label' => $label,
                'description' => 'Managed via Maintenance → Settings.',
                'is_public' => false,
                'sort_order' => $sortOrder,
            ],
        );
    }

    private static function truthy(mixed $value): bool
    {
        return in_array((string) $value, ['1', 'true', 'on', 'yes'], true);
    }
}
