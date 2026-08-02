<?php

namespace Modules\Billing\Support;

use Illuminate\Support\Facades\Schema;
use Modules\Billing\Models\OrderCharge;
use Modules\Billing\Models\Tariff;
use Modules\Billing\Models\TripAllowance;
use Modules\Orders\Models\DeliveryOrder;

/**
 * Billing overview: unpriced / uninvoiced orders, tariffs, and trip allowances.
 */
class BillingStatusBoard
{
    /**
     * @var list<string>
     */
    private const BILLABLE_STATUSES = [
        DeliveryOrder::STATUS_CONFIRMED,
        DeliveryOrder::STATUS_ASSIGNED,
        DeliveryOrder::STATUS_IN_TRANSIT,
        DeliveryOrder::STATUS_DELIVERED,
    ];

    /**
     * @return array<string, mixed>
     */
    public function build(int $recentLimit = 8): array
    {
        $hasOrders = Schema::hasTable('delivery_orders');
        $hasCharges = Schema::hasTable('order_charges');
        $hasTariffs = Schema::hasTable('tariffs');
        $hasAllowances = Schema::hasTable('trip_allowances');

        $unpriced = 0;
        $uninvoiced = 0;
        $uninvoicedAmount = 0.0;
        $billable = 0;
        $chargesThisMonth = 0.0;
        $chargesThisMonthCount = 0;
        $recent = [];

        if ($hasOrders) {
            $billableQuery = DeliveryOrder::query()->whereIn('status', self::BILLABLE_STATUSES);
            $billable = (int) (clone $billableQuery)->count();

            $unpriced = (int) (clone $billableQuery)
                ->where(function ($query): void {
                    $query->whereDoesntHave('charge')
                        ->orWhereHas('charge', fn ($q) => $q->where('amount', '<=', 0));
                })
                ->count();

            $uninvoicedQuery = DeliveryOrder::query()
                ->where('status', DeliveryOrder::STATUS_DELIVERED)
                ->whereDoesntHave('charge.invoiceLine');

            $uninvoiced = (int) (clone $uninvoicedQuery)->count();

            if ($hasCharges) {
                $uninvoicedAmount = (float) OrderCharge::query()
                    ->whereHas(
                        'deliveryOrder',
                        fn ($query) => $query->where('status', DeliveryOrder::STATUS_DELIVERED),
                    )
                    ->whereDoesntHave('invoiceLine')
                    ->sum('amount');
            }

            $recent = DeliveryOrder::query()
                ->with(['partner:id,code,name', 'charge:id,delivery_order_id,amount,tariff_id'])
                ->where('status', DeliveryOrder::STATUS_DELIVERED)
                ->whereDoesntHave('charge.invoiceLine')
                ->latest('order_date')
                ->latest('id')
                ->limit($recentLimit)
                ->get(['id', 'code', 'partner_id', 'status', 'order_date', 'pickup_address', 'delivery_address'])
                ->map(fn (DeliveryOrder $order): array => [
                    'id' => $order->id,
                    'code' => $order->code,
                    'status' => $order->status,
                    'order_date' => $order->order_date?->toDateString(),
                    'route' => trim(($order->pickup_address ?? '').' → '.($order->delivery_address ?? ''), ' →'),
                    'amount' => $order->charge ? (float) $order->charge->amount : 0.0,
                    'partner' => $order->partner
                        ? [
                            'id' => $order->partner->id,
                            'code' => $order->partner->code,
                            'name' => $order->partner->name,
                        ]
                        : null,
                ])
                ->all();
        }

        if ($hasCharges) {
            $monthCharges = OrderCharge::query()
                ->whereBetween('created_at', [now()->startOfMonth(), now()->endOfMonth()]);

            $chargesThisMonthCount = (int) (clone $monthCharges)->count();
            $chargesThisMonth = (float) (clone $monthCharges)->sum('amount');
        }

        $tariffsActive = 0;
        $tariffsTotal = 0;
        if ($hasTariffs) {
            $tariffsTotal = (int) Tariff::query()->count();
            $tariffsActive = (int) Tariff::query()->where('is_active', true)->count();
        }

        $allowancesIssued = 0;
        $allowancesOutstanding = 0.0;
        $allowancesSettledMonth = 0;
        if ($hasAllowances) {
            $allowancesIssued = (int) TripAllowance::query()
                ->where('status', TripAllowance::STATUS_ISSUED)
                ->count();
            $allowancesOutstanding = (float) TripAllowance::query()
                ->where('status', TripAllowance::STATUS_ISSUED)
                ->sum('advance_amount');
            $allowancesSettledMonth = (int) TripAllowance::query()
                ->where('status', TripAllowance::STATUS_SETTLED)
                ->whereBetween('settled_at', [now()->startOfMonth(), now()->endOfMonth()])
                ->count();
        }

        $attention = $unpriced + $uninvoiced + $allowancesIssued;

        return [
            'charges' => [
                'billable' => $billable,
                'unpriced' => $unpriced,
                'uninvoiced' => $uninvoiced,
                'uninvoiced_amount' => round($uninvoicedAmount, 2),
                'this_month_amount' => round($chargesThisMonth, 2),
                'this_month_count' => $chargesThisMonthCount,
            ],
            'tariffs' => [
                'active' => $tariffsActive,
                'total' => $tariffsTotal,
            ],
            'allowances' => [
                'issued' => $allowancesIssued,
                'outstanding_advance' => round($allowancesOutstanding, 2),
                'settled_this_month' => $allowancesSettledMonth,
            ],
            'alerts' => [
                'attention' => $attention,
            ],
            'recent' => $recent,
        ];
    }
}
