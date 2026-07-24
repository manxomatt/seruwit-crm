<?php

namespace Modules\Receivables\Support;

use Carbon\Carbon;
use Illuminate\Support\Collection;
use Modules\Invoicing\Models\Invoice;

class AgingReport
{
    /**
     * @return array{
     *     buckets: array<string, float>,
     *     overdue_count: int,
     *     overdue_amount: float,
     *     rows: list<array<string, mixed>>
     * }
     */
    public static function build(?int $partnerId = null): array
    {
        $today = now()->startOfDay();

        $invoices = Invoice::query()
            ->with('partner:id,code,name')
            ->whereIn('status', [Invoice::STATUS_ISSUED, Invoice::STATUS_PARTIALLY_PAID])
            ->when($partnerId, fn ($q) => $q->where('partner_id', $partnerId))
            ->orderBy('due_date')
            ->orderBy('issue_date')
            ->get();

        $buckets = [
            'current' => 0.0,
            '1_30' => 0.0,
            '31_60' => 0.0,
            '61_90' => 0.0,
            '90_plus' => 0.0,
        ];

        $rows = [];
        $overdueCount = 0;
        $overdueAmount = 0.0;

        foreach ($invoices as $invoice) {
            $balance = $invoice->balanceDue();

            if ($balance <= 0) {
                continue;
            }

            $anchor = $invoice->due_date ?? $invoice->issue_date;
            $due = Carbon::parse($anchor)->startOfDay();
            $daysPastDue = $due->lessThanOrEqualTo($today)
                ? (int) $due->diffInDays($today)
                : -(int) $today->diffInDays($due);
            $bucket = self::bucketFor($daysPastDue);
            $buckets[$bucket] = round($buckets[$bucket] + $balance, 2);

            $isOverdue = $daysPastDue > 0;

            if ($isOverdue) {
                $overdueCount++;
                $overdueAmount = round($overdueAmount + $balance, 2);
            }

            $rows[] = [
                'invoice_id' => $invoice->id,
                'code' => $invoice->code,
                'partner' => $invoice->partner,
                'issue_date' => $invoice->issue_date?->toDateString(),
                'due_date' => $invoice->due_date?->toDateString(),
                'total' => (float) $invoice->total,
                'amount_paid' => (float) $invoice->amount_paid,
                'balance' => $balance,
                'days_past_due' => max(0, $daysPastDue),
                'bucket' => $bucket,
                'is_overdue' => $isOverdue,
            ];
        }

        return [
            'buckets' => $buckets,
            'overdue_count' => $overdueCount,
            'overdue_amount' => $overdueAmount,
            'rows' => $rows,
        ];
    }

    public static function bucketFor(int $daysPastDue): string
    {
        if ($daysPastDue <= 0) {
            return 'current';
        }

        if ($daysPastDue <= 30) {
            return '1_30';
        }

        if ($daysPastDue <= 60) {
            return '31_60';
        }

        if ($daysPastDue <= 90) {
            return '61_90';
        }

        return '90_plus';
    }

    /**
     * @return Collection<int, array{partner_id: int, partner: mixed, outstanding: float, overdue: float}>
     */
    public static function byPartner(): Collection
    {
        $report = self::build();

        return collect($report['rows'])
            ->groupBy(fn (array $row) => $row['partner']['id'])
            ->map(function (Collection $rows) {
                $partner = $rows->first()['partner'];

                return [
                    'partner_id' => $partner['id'],
                    'partner' => $partner,
                    'outstanding' => round($rows->sum('balance'), 2),
                    'overdue' => round($rows->where('is_overdue', true)->sum('balance'), 2),
                ];
            })
            ->values();
    }
}
