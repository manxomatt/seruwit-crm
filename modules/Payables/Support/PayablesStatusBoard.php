<?php

namespace Modules\Payables\Support;

use Illuminate\Support\Facades\Schema;
use Modules\Payables\Models\BillPayment;
use Modules\Payables\Models\SupplierBill;

/**
 * Payables overview: open AP, aging mix, payments this month, and draft / overdue alerts.
 */
class PayablesStatusBoard
{
    /**
     * @return array<string, mixed>
     */
    public function build(int $recentLimit = 8, int $topPartnersLimit = 5): array
    {
        $aging = PayablesAgingReport::build();
        $openAp = round(collect($aging['buckets'])->sum(), 2);
        $openBills = count($aging['rows']);

        $draftBills = 0;
        if (Schema::hasTable('supplier_bills')) {
            $draftBills = (int) SupplierBill::query()
                ->where('status', SupplierBill::STATUS_DRAFT)
                ->count();
        }

        $postedThisMonth = 0.0;
        $paymentsPosted = 0;
        $paymentsVoided = 0;
        $recent = [];

        if (Schema::hasTable('bill_payments')) {
            $postedThisMonth = (float) BillPayment::query()
                ->where('status', BillPayment::STATUS_POSTED)
                ->whereBetween('payment_date', [now()->startOfMonth(), now()->endOfMonth()])
                ->sum('amount');

            $byStatus = BillPayment::query()
                ->selectRaw('status, count(*) as total')
                ->groupBy('status')
                ->pluck('total', 'status');

            $paymentsPosted = (int) ($byStatus[BillPayment::STATUS_POSTED] ?? 0);
            $paymentsVoided = (int) ($byStatus[BillPayment::STATUS_VOIDED] ?? 0);

            $recent = BillPayment::query()
                ->with('partner:id,code,name')
                ->latest('payment_date')
                ->latest('id')
                ->limit($recentLimit)
                ->get()
                ->map(fn (BillPayment $payment): array => [
                    'id' => $payment->id,
                    'code' => $payment->code,
                    'amount' => (float) $payment->amount,
                    'method' => $payment->method,
                    'status' => $payment->status,
                    'payment_date' => $payment->payment_date?->toDateString(),
                    'partner' => $payment->partner
                        ? [
                            'id' => $payment->partner->id,
                            'code' => $payment->partner->code,
                            'name' => $payment->partner->name,
                        ]
                        : null,
                ])
                ->all();
        }

        $topPartners = PayablesAgingReport::byPartner()
            ->sortByDesc('outstanding')
            ->take($topPartnersLimit)
            ->values()
            ->map(fn (array $row): array => [
                'partner_id' => $row['partner_id'],
                'code' => is_array($row['partner'])
                    ? ($row['partner']['code'] ?? null)
                    : ($row['partner']->code ?? null),
                'name' => is_array($row['partner'])
                    ? ($row['partner']['name'] ?? '—')
                    : ($row['partner']->name ?? '—'),
                'outstanding' => (float) $row['outstanding'],
                'overdue' => (float) $row['overdue'],
            ])
            ->all();

        $attention = (int) $aging['overdue_count'] + $draftBills;

        return [
            'summary' => [
                'open_ap' => $openAp,
                'open_bills' => $openBills,
                'draft_bills' => $draftBills,
                'posted_this_month' => round($postedThisMonth, 2),
                'payments_posted' => $paymentsPosted,
                'payments_voided' => $paymentsVoided,
            ],
            'aging' => [
                'buckets' => $aging['buckets'],
                'overdue_count' => (int) $aging['overdue_count'],
                'overdue_amount' => (float) $aging['overdue_amount'],
            ],
            'alerts' => [
                'draft_bills' => $draftBills,
                'attention' => $attention,
            ],
            'top_partners' => $topPartners,
            'recent' => $recent,
        ];
    }
}
