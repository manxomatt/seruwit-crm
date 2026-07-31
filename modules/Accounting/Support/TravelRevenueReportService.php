<?php

namespace Modules\Accounting\Support;

use Carbon\Carbon;
use Illuminate\Support\Collection;
use Modules\Accounting\Models\Account;
use Modules\Accounting\Models\JournalEntry;
use Modules\Accounting\Models\JournalLine;

/**
 * Travel revenue report: shuttle_revenue GL activity + linked operational sources.
 */
class TravelRevenueReportService
{
    /**
     * @return array{
     *     from: string,
     *     to: string,
     *     account: array{id: int, code: string, name: string}|null,
     *     rows: list<array{
     *         entry_date: string,
     *         journal_number: string,
     *         event: string|null,
     *         memo: string|null,
     *         source_type: string|null,
     *         source_id: int|null,
     *         debit: float,
     *         credit: float,
     *         net: float
     *     }>,
     *     totals: array{debit: float, credit: float, net: float},
     *     by_event: list<array{event: string, net: float, count: int}>
     * }
     */
    public function report(Carbon $from, Carbon $to): array
    {
        $account = Account::query()
            ->where('system_role', 'shuttle_revenue')
            ->where('is_active', true)
            ->where('is_postable', true)
            ->orderBy('code')
            ->first();

        if ($account === null) {
            return [
                'from' => $from->toDateString(),
                'to' => $to->toDateString(),
                'account' => null,
                'rows' => [],
                'totals' => ['debit' => 0.0, 'credit' => 0.0, 'net' => 0.0],
                'by_event' => [],
            ];
        }

        /** @var Collection<int, JournalLine> $lines */
        $lines = JournalLine::query()
            ->with(['journalEntry:id,number,entry_date,memo,event,source_type,source_id,status'])
            ->where('account_id', $account->id)
            ->whereHas('journalEntry', function ($q) use ($from, $to): void {
                $q->where('status', JournalEntry::STATUS_POSTED)
                    ->whereDate('entry_date', '>=', $from->toDateString())
                    ->whereDate('entry_date', '<=', $to->toDateString());
            })
            ->orderBy('id')
            ->get();

        $rows = [];
        $totalDebit = 0.0;
        $totalCredit = 0.0;
        $eventBuckets = [];

        foreach ($lines as $line) {
            $entry = $line->journalEntry;
            if ($entry === null) {
                continue;
            }

            $debit = (float) $line->debit;
            $credit = (float) $line->credit;
            // Revenue credit-normal: net revenue = credit - debit
            $net = round($credit - $debit, 2);
            $event = (string) ($entry->event ?: 'manual');

            $rows[] = [
                'entry_date' => $entry->entry_date?->toDateString() ?? '',
                'journal_number' => (string) $entry->number,
                'event' => $entry->event,
                'memo' => $entry->memo,
                'source_type' => $entry->source_type,
                'source_id' => $entry->source_id ? (int) $entry->source_id : null,
                'debit' => $debit,
                'credit' => $credit,
                'net' => $net,
            ];

            $totalDebit += $debit;
            $totalCredit += $credit;

            if (! isset($eventBuckets[$event])) {
                $eventBuckets[$event] = ['event' => $event, 'net' => 0.0, 'count' => 0];
            }
            $eventBuckets[$event]['net'] = round($eventBuckets[$event]['net'] + $net, 2);
            $eventBuckets[$event]['count']++;
        }

        usort($eventBuckets, fn (array $a, array $b): int => $b['net'] <=> $a['net']);

        return [
            'from' => $from->toDateString(),
            'to' => $to->toDateString(),
            'account' => [
                'id' => $account->id,
                'code' => $account->code,
                'name' => $account->name,
            ],
            'rows' => $rows,
            'totals' => [
                'debit' => round($totalDebit, 2),
                'credit' => round($totalCredit, 2),
                'net' => round($totalCredit - $totalDebit, 2),
            ],
            'by_event' => array_values($eventBuckets),
        ];
    }
}
