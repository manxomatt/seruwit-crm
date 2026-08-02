<?php

namespace Modules\Orders\Support;

use Illuminate\Support\Facades\Schema;
use Modules\Orders\Models\DeliveryOrder;

/**
 * Orders overview: open pipeline, GIN-ready queue, overdue promises, and recent DOs.
 */
class OrdersStatusBoard
{
    /**
     * @return array<string, mixed>
     */
    public function build(int $recentLimit = 8): array
    {
        if (! Schema::hasTable('delivery_orders')) {
            return $this->emptyBoard();
        }

        $byStatus = DeliveryOrder::query()
            ->selectRaw('status, count(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status');

        $draftCount = (int) ($byStatus[DeliveryOrder::STATUS_DRAFT] ?? 0);
        $confirmedCount = (int) ($byStatus[DeliveryOrder::STATUS_CONFIRMED] ?? 0);
        $assignedCount = (int) ($byStatus[DeliveryOrder::STATUS_ASSIGNED] ?? 0);
        $inTransitCount = (int) ($byStatus[DeliveryOrder::STATUS_IN_TRANSIT] ?? 0);
        $deliveredCount = (int) ($byStatus[DeliveryOrder::STATUS_DELIVERED] ?? 0);
        $cancelledCount = (int) ($byStatus[DeliveryOrder::STATUS_CANCELLED] ?? 0);

        $openPipeline = $draftCount + $confirmedCount + $assignedCount + $inTransitCount;
        $inFlight = $assignedCount + $inTransitCount;

        $readyFromGin = (int) DeliveryOrder::query()
            ->where('status', DeliveryOrder::STATUS_CONFIRMED)
            ->whereNotNull('goods_issue_note_id')
            ->whereNull('trip_id')
            ->count();

        $unassignedConfirmed = (int) DeliveryOrder::query()
            ->where('status', DeliveryOrder::STATUS_CONFIRMED)
            ->whereNull('trip_id')
            ->count();

        $now = now();

        $overdueCount = (int) DeliveryOrder::query()
            ->whereIn('status', [
                DeliveryOrder::STATUS_CONFIRMED,
                DeliveryOrder::STATUS_ASSIGNED,
                DeliveryOrder::STATUS_IN_TRANSIT,
            ])
            ->whereNotNull('promised_at')
            ->where('promised_at', '<', $now)
            ->count();

        $deliveredThisMonth = (int) DeliveryOrder::query()
            ->where('status', DeliveryOrder::STATUS_DELIVERED)
            ->whereBetween('delivered_at', [now()->startOfMonth(), now()->endOfMonth()])
            ->count();

        $demandOpenKg = (float) DeliveryOrder::query()
            ->whereIn('status', [
                DeliveryOrder::STATUS_DRAFT,
                DeliveryOrder::STATUS_CONFIRMED,
                DeliveryOrder::STATUS_ASSIGNED,
                DeliveryOrder::STATUS_IN_TRANSIT,
            ])
            ->sum('demand_kg');

        $demandDeliveredThisMonthKg = (float) DeliveryOrder::query()
            ->where('status', DeliveryOrder::STATUS_DELIVERED)
            ->whereBetween('delivered_at', [now()->startOfMonth(), now()->endOfMonth()])
            ->sum('demand_kg');

        $recent = DeliveryOrder::query()
            ->with([
                'partner:id,code,name',
                'trip:id,code',
            ])
            ->whereIn('status', [
                DeliveryOrder::STATUS_DRAFT,
                DeliveryOrder::STATUS_CONFIRMED,
                DeliveryOrder::STATUS_ASSIGNED,
                DeliveryOrder::STATUS_IN_TRANSIT,
            ])
            ->orderByRaw("case
                when status = 'in_transit' then 0
                when status = 'assigned' then 1
                when status = 'confirmed' then 2
                else 3
            end")
            ->orderBy('promised_at')
            ->orderByDesc('id')
            ->limit($recentLimit)
            ->get([
                'id',
                'code',
                'partner_id',
                'trip_id',
                'goods_issue_note_id',
                'status',
                'order_date',
                'promised_at',
                'pickup_address',
                'delivery_address',
                'demand_kg',
            ])
            ->map(function (DeliveryOrder $order) use ($now): array {
                $isOverdue = $order->promised_at !== null
                    && $order->promised_at->lessThan($now)
                    && in_array($order->status, [
                        DeliveryOrder::STATUS_CONFIRMED,
                        DeliveryOrder::STATUS_ASSIGNED,
                        DeliveryOrder::STATUS_IN_TRANSIT,
                    ], true);

                return [
                    'id' => $order->id,
                    'code' => $order->code,
                    'status' => $order->status,
                    'order_date' => $order->order_date?->toDateString(),
                    'promised_at' => $order->promised_at?->toIso8601String(),
                    'pickup_address' => $order->pickup_address,
                    'delivery_address' => $order->delivery_address,
                    'demand_kg' => $order->demand_kg !== null ? (float) $order->demand_kg : null,
                    'from_gin' => $order->goods_issue_note_id !== null,
                    'is_overdue' => $isOverdue,
                    'partner' => $order->partner
                        ? [
                            'id' => $order->partner->id,
                            'code' => $order->partner->code,
                            'name' => $order->partner->name,
                        ]
                        : null,
                    'trip' => $order->trip
                        ? [
                            'id' => $order->trip->id,
                            'code' => $order->trip->code,
                        ]
                        : null,
                ];
            })
            ->all();

        $attention = $overdueCount + $readyFromGin + $draftCount;

        return [
            'summary' => [
                'open_pipeline' => $openPipeline,
                'in_flight' => $inFlight,
                'ready_from_gin' => $readyFromGin,
                'unassigned_confirmed' => $unassignedConfirmed,
                'delivered_this_month' => $deliveredThisMonth,
                'demand_open_kg' => round($demandOpenKg, 2),
                'demand_delivered_this_month_kg' => round($demandDeliveredThisMonthKg, 2),
            ],
            'dispatch' => [
                'overdue_count' => $overdueCount,
                'draft_count' => $draftCount,
                'confirmed_count' => $confirmedCount,
                'assigned_count' => $assignedCount,
                'in_transit_count' => $inTransitCount,
            ],
            'by_status' => [
                'draft' => $draftCount,
                'confirmed' => $confirmedCount,
                'assigned' => $assignedCount,
                'in_transit' => $inTransitCount,
                'delivered' => $deliveredCount,
                'cancelled' => $cancelledCount,
            ],
            'alerts' => [
                'attention' => $attention,
            ],
            'recent' => $recent,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function emptyBoard(): array
    {
        return [
            'summary' => [
                'open_pipeline' => 0,
                'in_flight' => 0,
                'ready_from_gin' => 0,
                'unassigned_confirmed' => 0,
                'delivered_this_month' => 0,
                'demand_open_kg' => 0.0,
                'demand_delivered_this_month_kg' => 0.0,
            ],
            'dispatch' => [
                'overdue_count' => 0,
                'draft_count' => 0,
                'confirmed_count' => 0,
                'assigned_count' => 0,
                'in_transit_count' => 0,
            ],
            'by_status' => [
                'draft' => 0,
                'confirmed' => 0,
                'assigned' => 0,
                'in_transit' => 0,
                'delivered' => 0,
                'cancelled' => 0,
            ],
            'alerts' => [
                'attention' => 0,
            ],
            'recent' => [],
        ];
    }
}
