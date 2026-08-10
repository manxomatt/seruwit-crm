<?php

namespace Modules\Orders\Support;

use App\Models\Setting;

/**
 * Orders logistics behaviour settings. Edited via Orders → Settings.
 */
class OrdersSettings
{
    public const KEY_AUTO_CONFIRM_DO_FROM_GIN = 'orders.auto_confirm_do_from_gin';

    public const KEY_REQUIRE_POD_BEFORE_TRIP_COMPLETE = 'orders.require_pod_before_trip_complete';

    /**
     * @return list<string>
     */
    public static function managedKeys(): array
    {
        return [
            self::KEY_AUTO_CONFIRM_DO_FROM_GIN,
            self::KEY_REQUIRE_POD_BEFORE_TRIP_COMPLETE,
        ];
    }

    /**
     * @return list<string>
     */
    public static function requirePodModes(): array
    {
        return ['off', 'from_gin', 'all'];
    }

    /**
     * @return array{
     *     auto_confirm_do_from_gin: bool,
     *     require_pod_before_trip_complete: string
     * }
     */
    public static function all(): array
    {
        $mode = (string) Setting::getValue(self::KEY_REQUIRE_POD_BEFORE_TRIP_COMPLETE, 'off');

        if (! in_array($mode, self::requirePodModes(), true)) {
            $mode = 'off';
        }

        return [
            'auto_confirm_do_from_gin' => Setting::getValue(self::KEY_AUTO_CONFIRM_DO_FROM_GIN, '0') === '1',
            'require_pod_before_trip_complete' => $mode,
        ];
    }

    /**
     * @param  array{
     *     auto_confirm_do_from_gin: bool,
     *     require_pod_before_trip_complete: string
     * }  $data
     */
    public static function update(array $data): void
    {
        self::put(
            self::KEY_AUTO_CONFIRM_DO_FROM_GIN,
            $data['auto_confirm_do_from_gin'] ? '1' : '0',
            'boolean',
            'Auto-confirm DO from GIN',
            1,
        );
        self::put(
            self::KEY_REQUIRE_POD_BEFORE_TRIP_COMPLETE,
            (string) $data['require_pod_before_trip_complete'],
            'text',
            'Require POD before trip complete',
            2,
        );
    }

    private static function put(string $key, string $value, string $type, string $label, int $sortOrder): void
    {
        Setting::query()->updateOrCreate(
            ['key' => $key],
            [
                'group' => 'orders',
                'value' => $value,
                'type' => $type,
                'label' => $label,
                'description' => 'Managed via Orders → Settings.',
                'is_public' => false,
                'sort_order' => $sortOrder,
            ],
        );
    }
}
