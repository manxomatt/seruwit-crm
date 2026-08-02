<?php

namespace Modules\Receivables\Support;

use Illuminate\Support\Facades\Schema;
use Modules\Partners\Models\Partner;
use Modules\Receivables\Models\GatewayCharge;
use Modules\Receivables\Models\Payment;

/**
 * Receivables overview: open AR, aging mix, collections this month, and credit alerts.
 */
class ReceivablesStatusBoard
{
    /**
     * @return array<string, mixed>
     */
    public function build(int $recentLimit = 8, int $topPartnersLimit = 5): array
    {
        $aging = Schema::hasTable('invoices')
            ? AgingReport::build()
            : [
                'buckets' => [
                    'current' => 0.0,
                    '1_30' => 0.0,
                    '31_60' => 0.0,
                    '61_90' => 0.0,
                    '90_plus' => 0.0,
                ],
                'overdue_count' => 0,
                'overdue_amount' => 0.0,
                'rows' => [],
            ];

        $openAr = round(collect($aging['buckets'])->sum(), 2);
        $openInvoices = count($aging['rows']);

        $postedThisMonth = 0.0;
        $paymentsPosted = 0;
        $paymentsVoided = 0;
        $recent = [];

        if (Schema::hasTable('payments')) {
            $postedThisMonth = (float) Payment::query()
                ->where('status', Payment::STATUS_POSTED)
                ->whereBetween('payment_date', [now()->startOfMonth(), now()->endOfMonth()])
                ->sum('amount');

            $byStatus = Payment::query()
                ->selectRaw('status, count(*) as total')
                ->groupBy('status')
                ->pluck('total', 'status');

            $paymentsPosted = (int) ($byStatus[Payment::STATUS_POSTED] ?? 0);
            $paymentsVoided = (int) ($byStatus[Payment::STATUS_VOIDED] ?? 0);

            $recent = Payment::query()
                ->with('partner:id,code,name')
                ->latest('payment_date')
                ->latest('id')
                ->limit($recentLimit)
                ->get()
                ->map(fn (Payment $payment): array => [
                    'id' => $payment->id,
                    'code' => $payment->code,
                    'amount' => (float) $payment->amount,
                    'type' => $payment->type,
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

        $topPartners = Schema::hasTable('invoices')
            ? AgingReport::byPartner()
                ->sortByDesc('outstanding')
                ->take($topPartnersLimit)
                ->values()
                ->map(fn (array $row): array => [
                    'partner_id' => $row['partner_id'],
                    'code' => $row['partner']['code'] ?? null,
                    'name' => $row['partner']['name'] ?? '—',
                    'outstanding' => (float) $row['outstanding'],
                    'overdue' => (float) $row['overdue'],
                ])
                ->all()
            : [];

        $overLimit = 0;
        if (Schema::hasTable('partners') && Schema::hasColumn('partners', 'credit_limit')) {
            $partnerIds = collect($aging['rows'])
                ->pluck('partner.id')
                ->filter()
                ->unique()
                ->values()
                ->all();

            if ($partnerIds !== []) {
                $overLimit = Partner::query()
                    ->whereIn('id', $partnerIds)
                    ->whereNotNull('credit_limit')
                    ->where('credit_limit', '>', 0)
                    ->get(['id', 'credit_limit'])
                    ->filter(fn (Partner $partner): bool => CreditLimitChecker::wouldExceed(
                        $partner,
                        0,
                        null,
                        false,
                    ))
                    ->count();
            }
        }

        $gatewayPending = 0;
        if (Schema::hasTable('gateway_charges')) {
            $gatewayPending = (int) GatewayCharge::query()
                ->where('status', GatewayCharge::STATUS_PENDING)
                ->count();
        }

        $attention = (int) $aging['overdue_count'] + $overLimit + $gatewayPending;

        return [
            'summary' => [
                'open_ar' => $openAr,
                'open_invoices' => $openInvoices,
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
                'over_limit' => $overLimit,
                'gateway_pending' => $gatewayPending,
                'attention' => $attention,
            ],
            'top_partners' => $topPartners,
            'recent' => $recent,
        ];
    }
}
