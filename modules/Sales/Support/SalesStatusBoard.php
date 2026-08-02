<?php

namespace Modules\Sales\Support;

use Illuminate\Support\Facades\Schema;
use Modules\Sales\Models\GoodsIssueNote;
use Modules\Sales\Models\PriceList;
use Modules\Sales\Models\SalesOrder;
use Modules\Sales\Models\SalesReturn;

/**
 * Sales overview: open SOs, overdue promises, GIN queue, returns, and price lists.
 */
class SalesStatusBoard
{
    /**
     * @return array<string, mixed>
     */
    public function build(int $recentLimit = 8): array
    {
        if (! Schema::hasTable('sales_orders')) {
            return $this->emptyBoard();
        }

        $byStatus = SalesOrder::query()
            ->selectRaw('status, count(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status');

        $draftCount = (int) ($byStatus[SalesOrder::STATUS_DRAFT] ?? 0);
        $confirmedCount = (int) ($byStatus[SalesOrder::STATUS_CONFIRMED] ?? 0);
        $partialCount = (int) ($byStatus[SalesOrder::STATUS_PARTIAL_DELIVERED] ?? 0);
        $fullyDeliveredCount = (int) ($byStatus[SalesOrder::STATUS_FULLY_DELIVERED] ?? 0);
        $closedCount = (int) ($byStatus[SalesOrder::STATUS_CLOSED] ?? 0);
        $cancelledCount = (int) ($byStatus[SalesOrder::STATUS_CANCELLED] ?? 0);

        $awaitingIssue = $confirmedCount + $partialCount;
        $openPipeline = $draftCount + $awaitingIssue;

        $openAmount = (float) SalesOrder::query()
            ->whereIn('status', [
                SalesOrder::STATUS_CONFIRMED,
                SalesOrder::STATUS_PARTIAL_DELIVERED,
            ])
            ->sum('total_amount');

        $today = now()->toDateString();

        $overdueCount = (int) SalesOrder::query()
            ->whereIn('status', [
                SalesOrder::STATUS_CONFIRMED,
                SalesOrder::STATUS_PARTIAL_DELIVERED,
            ])
            ->whereNotNull('promised_at')
            ->whereDate('promised_at', '<', $today)
            ->count();

        $overdueAmount = (float) SalesOrder::query()
            ->whereIn('status', [
                SalesOrder::STATUS_CONFIRMED,
                SalesOrder::STATUS_PARTIAL_DELIVERED,
            ])
            ->whereNotNull('promised_at')
            ->whereDate('promised_at', '<', $today)
            ->sum('total_amount');

        $orderedThisMonth = (int) SalesOrder::query()
            ->whereBetween('ordered_at', [now()->startOfMonth()->toDateString(), now()->endOfMonth()->toDateString()])
            ->count();

        $orderedThisMonthAmount = (float) SalesOrder::query()
            ->whereBetween('ordered_at', [now()->startOfMonth()->toDateString(), now()->endOfMonth()->toDateString()])
            ->sum('total_amount');

        $ginDraft = 0;
        $ginConfirmedThisMonth = 0;
        if (Schema::hasTable('goods_issue_notes')) {
            $ginDraft = (int) GoodsIssueNote::query()
                ->where('status', GoodsIssueNote::STATUS_DRAFT)
                ->count();

            $ginConfirmedThisMonth = (int) GoodsIssueNote::query()
                ->where('status', GoodsIssueNote::STATUS_CONFIRMED)
                ->whereBetween('issued_at', [now()->startOfMonth()->toDateString(), now()->endOfMonth()->toDateString()])
                ->count();
        }

        $returnsDraft = 0;
        $returnsConfirmedThisMonth = 0;
        if (Schema::hasTable('sales_returns')) {
            $returnsDraft = (int) SalesReturn::query()
                ->where('status', SalesReturn::STATUS_DRAFT)
                ->count();

            $returnsConfirmedThisMonth = (int) SalesReturn::query()
                ->where('status', SalesReturn::STATUS_CONFIRMED)
                ->whereBetween('returned_at', [now()->startOfMonth()->toDateString(), now()->endOfMonth()->toDateString()])
                ->count();
        }

        $priceListsActive = 0;
        $priceListsTotal = 0;
        if (Schema::hasTable('price_lists')) {
            $priceListsTotal = (int) PriceList::query()->count();
            $priceListsActive = (int) PriceList::query()->where('is_active', true)->count();
        }

        $recent = SalesOrder::query()
            ->with(['partner:id,code,name', 'warehouse:id,name'])
            ->whereIn('status', [
                SalesOrder::STATUS_DRAFT,
                SalesOrder::STATUS_CONFIRMED,
                SalesOrder::STATUS_PARTIAL_DELIVERED,
            ])
            ->latest('ordered_at')
            ->latest('id')
            ->limit($recentLimit)
            ->get(['id', 'so_number', 'partner_id', 'warehouse_id', 'status', 'ordered_at', 'promised_at', 'total_amount'])
            ->map(function (SalesOrder $so) use ($today): array {
                $isOverdue = $so->promised_at !== null
                    && $so->promised_at->toDateString() < $today
                    && in_array($so->status, [
                        SalesOrder::STATUS_CONFIRMED,
                        SalesOrder::STATUS_PARTIAL_DELIVERED,
                    ], true);

                return [
                    'id' => $so->id,
                    'so_number' => $so->so_number,
                    'status' => $so->status,
                    'ordered_at' => $so->ordered_at?->toDateString(),
                    'promised_at' => $so->promised_at?->toDateString(),
                    'total_amount' => (float) $so->total_amount,
                    'is_overdue' => $isOverdue,
                    'partner' => $so->partner
                        ? [
                            'id' => $so->partner->id,
                            'code' => $so->partner->code,
                            'name' => $so->partner->name,
                        ]
                        : null,
                    'warehouse' => $so->warehouse
                        ? [
                            'id' => $so->warehouse->id,
                            'name' => $so->warehouse->name,
                        ]
                        : null,
                ];
            })
            ->all();

        $attention = $overdueCount + $draftCount + $ginDraft + $returnsDraft;

        return [
            'summary' => [
                'open_pipeline' => $openPipeline,
                'awaiting_issue' => $awaitingIssue,
                'open_amount' => round($openAmount, 2),
                'draft_count' => $draftCount,
                'ordered_this_month' => $orderedThisMonth,
                'ordered_this_month_amount' => round($orderedThisMonthAmount, 2),
            ],
            'fulfillment' => [
                'overdue_count' => $overdueCount,
                'overdue_amount' => round($overdueAmount, 2),
                'gin_draft' => $ginDraft,
                'gin_confirmed_this_month' => $ginConfirmedThisMonth,
            ],
            'returns' => [
                'draft' => $returnsDraft,
                'confirmed_this_month' => $returnsConfirmedThisMonth,
            ],
            'price_lists' => [
                'active' => $priceListsActive,
                'total' => $priceListsTotal,
            ],
            'by_status' => [
                'draft' => $draftCount,
                'confirmed' => $confirmedCount,
                'partial_delivered' => $partialCount,
                'fully_delivered' => $fullyDeliveredCount,
                'closed' => $closedCount,
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
                'awaiting_issue' => 0,
                'open_amount' => 0.0,
                'draft_count' => 0,
                'ordered_this_month' => 0,
                'ordered_this_month_amount' => 0.0,
            ],
            'fulfillment' => [
                'overdue_count' => 0,
                'overdue_amount' => 0.0,
                'gin_draft' => 0,
                'gin_confirmed_this_month' => 0,
            ],
            'returns' => [
                'draft' => 0,
                'confirmed_this_month' => 0,
            ],
            'price_lists' => [
                'active' => 0,
                'total' => 0,
            ],
            'by_status' => [
                'draft' => 0,
                'confirmed' => 0,
                'partial_delivered' => 0,
                'fully_delivered' => 0,
                'closed' => 0,
                'cancelled' => 0,
            ],
            'alerts' => [
                'attention' => 0,
            ],
            'recent' => [],
        ];
    }
}
