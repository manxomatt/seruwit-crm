<?php

namespace Modules\Purchasing\Support;

use Illuminate\Support\Facades\Schema;
use Modules\Purchasing\Models\GoodReceiptNote;
use Modules\Purchasing\Models\PurchaseOrder;
use Modules\Purchasing\Models\PurchaseReturn;

/**
 * Purchasing overview: open POs, overdue receipts, GRN queue, and returns.
 */
class PurchasingStatusBoard
{
    /**
     * @return array<string, mixed>
     */
    public function build(int $recentLimit = 8): array
    {
        if (! Schema::hasTable('purchase_orders')) {
            return $this->emptyBoard();
        }

        $byStatus = PurchaseOrder::query()
            ->selectRaw('status, count(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status');

        $draftCount = (int) ($byStatus[PurchaseOrder::STATUS_DRAFT] ?? 0);
        $submittedCount = (int) ($byStatus[PurchaseOrder::STATUS_SUBMITTED] ?? 0);
        $approvedCount = (int) ($byStatus[PurchaseOrder::STATUS_APPROVED] ?? 0);
        $partialCount = (int) ($byStatus[PurchaseOrder::STATUS_PARTIAL_RECEIVED] ?? 0);
        $fullyReceivedCount = (int) ($byStatus[PurchaseOrder::STATUS_FULLY_RECEIVED] ?? 0);
        $closedCount = (int) ($byStatus[PurchaseOrder::STATUS_CLOSED] ?? 0);
        $cancelledCount = (int) ($byStatus[PurchaseOrder::STATUS_CANCELLED] ?? 0);

        $awaitingReceipt = $approvedCount + $partialCount;
        $openPipeline = $draftCount + $submittedCount + $awaitingReceipt;

        $openAmount = (float) PurchaseOrder::query()
            ->whereIn('status', [
                PurchaseOrder::STATUS_APPROVED,
                PurchaseOrder::STATUS_PARTIAL_RECEIVED,
            ])
            ->sum('total_amount');

        $today = now()->toDateString();

        $overdueCount = (int) PurchaseOrder::query()
            ->whereIn('status', [
                PurchaseOrder::STATUS_APPROVED,
                PurchaseOrder::STATUS_PARTIAL_RECEIVED,
            ])
            ->whereNotNull('expected_at')
            ->whereDate('expected_at', '<', $today)
            ->count();

        $overdueAmount = (float) PurchaseOrder::query()
            ->whereIn('status', [
                PurchaseOrder::STATUS_APPROVED,
                PurchaseOrder::STATUS_PARTIAL_RECEIVED,
            ])
            ->whereNotNull('expected_at')
            ->whereDate('expected_at', '<', $today)
            ->sum('total_amount');

        $orderedThisMonth = (int) PurchaseOrder::query()
            ->whereBetween('ordered_at', [now()->startOfMonth()->toDateString(), now()->endOfMonth()->toDateString()])
            ->count();

        $orderedThisMonthAmount = (float) PurchaseOrder::query()
            ->whereBetween('ordered_at', [now()->startOfMonth()->toDateString(), now()->endOfMonth()->toDateString()])
            ->sum('total_amount');

        $grnDraft = 0;
        $grnConfirmedThisMonth = 0;
        if (Schema::hasTable('good_receipt_notes')) {
            $grnDraft = (int) GoodReceiptNote::query()
                ->where('status', GoodReceiptNote::STATUS_DRAFT)
                ->count();

            $grnConfirmedThisMonth = (int) GoodReceiptNote::query()
                ->where('status', GoodReceiptNote::STATUS_CONFIRMED)
                ->whereBetween('received_at', [now()->startOfMonth()->toDateString(), now()->endOfMonth()->toDateString()])
                ->count();
        }

        $returnsDraft = 0;
        $returnsConfirmedThisMonth = 0;
        if (Schema::hasTable('purchase_returns')) {
            $returnsDraft = (int) PurchaseReturn::query()
                ->where('status', PurchaseReturn::STATUS_DRAFT)
                ->count();

            $returnsConfirmedThisMonth = (int) PurchaseReturn::query()
                ->where('status', PurchaseReturn::STATUS_CONFIRMED)
                ->whereBetween('returned_at', [now()->startOfMonth()->toDateString(), now()->endOfMonth()->toDateString()])
                ->count();
        }

        $recent = PurchaseOrder::query()
            ->with(['partner:id,code,name', 'warehouse:id,name'])
            ->whereIn('status', [
                PurchaseOrder::STATUS_DRAFT,
                PurchaseOrder::STATUS_SUBMITTED,
                PurchaseOrder::STATUS_APPROVED,
                PurchaseOrder::STATUS_PARTIAL_RECEIVED,
            ])
            ->latest('ordered_at')
            ->latest('id')
            ->limit($recentLimit)
            ->get(['id', 'po_number', 'partner_id', 'warehouse_id', 'status', 'ordered_at', 'expected_at', 'total_amount'])
            ->map(function (PurchaseOrder $po) use ($today): array {
                $isOverdue = $po->expected_at !== null
                    && $po->expected_at->toDateString() < $today
                    && in_array($po->status, [
                        PurchaseOrder::STATUS_APPROVED,
                        PurchaseOrder::STATUS_PARTIAL_RECEIVED,
                    ], true);

                return [
                    'id' => $po->id,
                    'po_number' => $po->po_number,
                    'status' => $po->status,
                    'ordered_at' => $po->ordered_at?->toDateString(),
                    'expected_at' => $po->expected_at?->toDateString(),
                    'total_amount' => (float) $po->total_amount,
                    'is_overdue' => $isOverdue,
                    'partner' => $po->partner
                        ? [
                            'id' => $po->partner->id,
                            'code' => $po->partner->code,
                            'name' => $po->partner->name,
                        ]
                        : null,
                    'warehouse' => $po->warehouse
                        ? [
                            'id' => $po->warehouse->id,
                            'name' => $po->warehouse->name,
                        ]
                        : null,
                ];
            })
            ->all();

        $attention = $overdueCount + $submittedCount + $grnDraft + $returnsDraft;

        return [
            'summary' => [
                'open_pipeline' => $openPipeline,
                'awaiting_receipt' => $awaitingReceipt,
                'open_amount' => round($openAmount, 2),
                'draft_count' => $draftCount,
                'submitted_count' => $submittedCount,
                'ordered_this_month' => $orderedThisMonth,
                'ordered_this_month_amount' => round($orderedThisMonthAmount, 2),
            ],
            'receipts' => [
                'overdue_count' => $overdueCount,
                'overdue_amount' => round($overdueAmount, 2),
                'grn_draft' => $grnDraft,
                'grn_confirmed_this_month' => $grnConfirmedThisMonth,
            ],
            'returns' => [
                'draft' => $returnsDraft,
                'confirmed_this_month' => $returnsConfirmedThisMonth,
            ],
            'by_status' => [
                'draft' => $draftCount,
                'submitted' => $submittedCount,
                'approved' => $approvedCount,
                'partial_received' => $partialCount,
                'fully_received' => $fullyReceivedCount,
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
                'awaiting_receipt' => 0,
                'open_amount' => 0.0,
                'draft_count' => 0,
                'submitted_count' => 0,
                'ordered_this_month' => 0,
                'ordered_this_month_amount' => 0.0,
            ],
            'receipts' => [
                'overdue_count' => 0,
                'overdue_amount' => 0.0,
                'grn_draft' => 0,
                'grn_confirmed_this_month' => 0,
            ],
            'returns' => [
                'draft' => 0,
                'confirmed_this_month' => 0,
            ],
            'by_status' => [
                'draft' => 0,
                'submitted' => 0,
                'approved' => 0,
                'partial_received' => 0,
                'fully_received' => 0,
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
