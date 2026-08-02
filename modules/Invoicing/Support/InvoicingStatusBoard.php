<?php

namespace Modules\Invoicing\Support;

use Illuminate\Support\Facades\Schema;
use Modules\Invoicing\Models\Invoice;

/**
 * Invoicing overview: outstanding balances, overdue drafts, and recent collections.
 */
class InvoicingStatusBoard
{
    /**
     * @return array<string, mixed>
     */
    public function build(int $recentLimit = 8): array
    {
        if (! Schema::hasTable('invoices')) {
            return [
                'summary' => [
                    'outstanding' => 0.0,
                    'open_count' => 0,
                    'draft_count' => 0,
                    'void_count' => 0,
                    'paid_this_month' => 0.0,
                    'issued_this_month' => 0,
                ],
                'aging' => [
                    'overdue_count' => 0,
                    'overdue_amount' => 0.0,
                    'current_count' => 0,
                    'current_amount' => 0.0,
                ],
                'by_status' => [
                    'draft' => 0,
                    'issued' => 0,
                    'partially_paid' => 0,
                    'paid' => 0,
                    'void' => 0,
                ],
                'alerts' => [
                    'attention' => 0,
                ],
                'recent' => [],
            ];
        }

        $byStatus = Invoice::query()
            ->selectRaw('status, count(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status');

        $openInvoices = Invoice::query()
            ->with('partner:id,code,name')
            ->whereIn('status', [Invoice::STATUS_ISSUED, Invoice::STATUS_PARTIALLY_PAID])
            ->get(['id', 'code', 'partner_id', 'status', 'issue_date', 'due_date', 'total', 'amount_paid']);

        $outstanding = round($openInvoices->sum(fn (Invoice $invoice): float => $invoice->balanceDue()), 2);
        $today = now()->startOfDay();

        $overdueCount = 0;
        $overdueAmount = 0.0;
        $currentCount = 0;
        $currentAmount = 0.0;

        foreach ($openInvoices as $invoice) {
            $balance = $invoice->balanceDue();

            if ($balance <= 0) {
                continue;
            }

            $due = $invoice->due_date ?? $invoice->issue_date;
            $isOverdue = $due !== null && $due->copy()->startOfDay()->lessThan($today);

            if ($isOverdue) {
                $overdueCount++;
                $overdueAmount = round($overdueAmount + $balance, 2);
            } else {
                $currentCount++;
                $currentAmount = round($currentAmount + $balance, 2);
            }
        }

        $paidThisMonth = (float) Invoice::query()
            ->where('status', Invoice::STATUS_PAID)
            ->whereBetween('paid_at', [now()->startOfMonth(), now()->endOfMonth()])
            ->sum('total');

        $issuedThisMonth = (int) Invoice::query()
            ->whereIn('status', [
                Invoice::STATUS_ISSUED,
                Invoice::STATUS_PARTIALLY_PAID,
                Invoice::STATUS_PAID,
            ])
            ->whereBetween('issue_date', [now()->startOfMonth()->toDateString(), now()->endOfMonth()->toDateString()])
            ->count();

        $draftCount = (int) ($byStatus[Invoice::STATUS_DRAFT] ?? 0);
        $voidCount = (int) ($byStatus[Invoice::STATUS_VOID] ?? 0);

        $recent = $openInvoices
            ->sortByDesc(fn (Invoice $invoice): string => $invoice->issue_date?->toDateString() ?? '')
            ->take($recentLimit)
            ->values()
            ->map(function (Invoice $invoice) use ($today): array {
                $due = $invoice->due_date ?? $invoice->issue_date;
                $isOverdue = $due !== null && $due->copy()->startOfDay()->lessThan($today);

                return [
                    'id' => $invoice->id,
                    'code' => $invoice->code,
                    'status' => $invoice->status,
                    'issue_date' => $invoice->issue_date?->toDateString(),
                    'due_date' => $invoice->due_date?->toDateString(),
                    'total' => (float) $invoice->total,
                    'balance' => $invoice->balanceDue(),
                    'is_overdue' => $isOverdue,
                    'partner' => $invoice->partner
                        ? [
                            'id' => $invoice->partner->id,
                            'code' => $invoice->partner->code,
                            'name' => $invoice->partner->name,
                        ]
                        : null,
                ];
            })
            ->all();

        $attention = $overdueCount + $draftCount;

        return [
            'summary' => [
                'outstanding' => $outstanding,
                'open_count' => $openInvoices->count(),
                'draft_count' => $draftCount,
                'void_count' => $voidCount,
                'paid_this_month' => round($paidThisMonth, 2),
                'issued_this_month' => $issuedThisMonth,
            ],
            'aging' => [
                'overdue_count' => $overdueCount,
                'overdue_amount' => $overdueAmount,
                'current_count' => $currentCount,
                'current_amount' => $currentAmount,
            ],
            'by_status' => [
                'draft' => $draftCount,
                'issued' => (int) ($byStatus[Invoice::STATUS_ISSUED] ?? 0),
                'partially_paid' => (int) ($byStatus[Invoice::STATUS_PARTIALLY_PAID] ?? 0),
                'paid' => (int) ($byStatus[Invoice::STATUS_PAID] ?? 0),
                'void' => $voidCount,
            ],
            'alerts' => [
                'attention' => $attention,
            ],
            'recent' => $recent,
        ];
    }
}
