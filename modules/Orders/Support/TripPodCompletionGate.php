<?php

namespace Modules\Orders\Support;

use App\Models\Setting;
use Illuminate\Support\Collection;
use Modules\Orders\Models\DeliveryOrder;
use Modules\TransportationManagement\Models\Trip;

/**
 * Decides whether a trip may be completed without POD for its delivery orders.
 */
class TripPodCompletionGate
{
    public const MODE_OFF = 'off';

    public const MODE_FROM_GIN = 'from_gin';

    public const MODE_ALL = 'all';

    public static function mode(): string
    {
        $mode = (string) Setting::getValue('orders.require_pod_before_trip_complete', self::MODE_OFF);

        return in_array($mode, [self::MODE_OFF, self::MODE_FROM_GIN, self::MODE_ALL], true)
            ? $mode
            : self::MODE_OFF;
    }

    /**
     * Orders that lack POD and should block trip completion under the current setting.
     *
     * @return Collection<int, DeliveryOrder>
     */
    public static function blockingOrders(Trip $trip): Collection
    {
        $mode = self::mode();

        if ($mode === self::MODE_OFF) {
            return collect();
        }

        $withoutPod = $trip->deliveryOrders()
            ->whereDoesntHave('pod')
            ->get(['id', 'code', 'goods_issue_note_id']);

        if ($mode === self::MODE_FROM_GIN) {
            return $withoutPod->filter(fn (DeliveryOrder $order): bool => $order->goods_issue_note_id !== null)->values();
        }

        return $withoutPod->values();
    }

    /**
     * @return Collection<int, DeliveryOrder>
     */
    public static function ordersWithoutPod(Trip $trip): Collection
    {
        return $trip->deliveryOrders()
            ->whereDoesntHave('pod')
            ->get(['id', 'code', 'goods_issue_note_id']);
    }
}
