<?php

namespace Modules\Accounting\Support;

use Modules\Accounting\Models\Account;
use Modules\Accounting\Models\JournalEntry;
use Modules\Accounting\Models\JournalLine;
use Modules\Partners\Models\Partner;

class PartnerStatementService
{
    /** @var list<string> */
    private const CONTROL_ROLES = ['ar_control', 'ap_control'];

    /**
     * @return array<string, mixed>
     */
    public function forPartner(Partner $partner, string $from, string $to): array
    {
        $dayBefore = date('Y-m-d', strtotime($from.' -1 day'));

        $opening = $this->balanceAsOf($partner, $dayBefore);
        $lines = JournalLine::query()
            ->with(['journalEntry:id,number,entry_date,memo', 'account:id,code,name,system_role,normal_balance'])
            ->where('partner_id', $partner->id)
            ->whereHas('account', fn ($q) => $q->whereIn('system_role', self::CONTROL_ROLES))
            ->whereHas('journalEntry', function ($query) use ($from, $to): void {
                $query->where('status', JournalEntry::STATUS_POSTED)
                    ->whereDate('entry_date', '>=', $from)
                    ->whereDate('entry_date', '<=', $to);
            })
            ->join('journal_entries', 'journal_entries.id', '=', 'journal_lines.journal_entry_id')
            ->orderBy('journal_entries.entry_date')
            ->orderBy('journal_entries.id')
            ->orderBy('journal_lines.id')
            ->select('journal_lines.*')
            ->get();

        $running = $opening;
        $rows = [];
        $totalDebit = 0.0;
        $totalCredit = 0.0;

        foreach ($lines as $line) {
            $debit = round((float) $line->debit, 2);
            $credit = round((float) $line->credit, 2);
            $totalDebit += $debit;
            $totalCredit += $credit;
            $running = round($running + $this->signedMovement($line->account, $debit, $credit), 2);

            $rows[] = [
                'id' => $line->id,
                'entry_date' => $line->journalEntry?->entry_date?->toDateString(),
                'journal_id' => $line->journal_entry_id,
                'journal_number' => $line->journalEntry?->number,
                'account' => $line->account
                    ? ['id' => $line->account->id, 'code' => $line->account->code, 'name' => $line->account->name]
                    : null,
                'memo' => $line->memo ?: $line->journalEntry?->memo,
                'debit' => $debit,
                'credit' => $credit,
                'balance' => $running,
            ];
        }

        return [
            'partner' => [
                'id' => $partner->id,
                'code' => $partner->code,
                'name' => $partner->name,
            ],
            'from' => $from,
            'to' => $to,
            'opening_balance' => $opening,
            'rows' => $rows,
            'total_debit' => round($totalDebit, 2),
            'total_credit' => round($totalCredit, 2),
            'closing_balance' => $running,
        ];
    }

    private function balanceAsOf(Partner $partner, string $asOf): float
    {
        $lines = JournalLine::query()
            ->with('account:id,normal_balance,system_role')
            ->where('partner_id', $partner->id)
            ->whereHas('account', fn ($q) => $q->whereIn('system_role', self::CONTROL_ROLES))
            ->whereHas('journalEntry', function ($query) use ($asOf): void {
                $query->where('status', JournalEntry::STATUS_POSTED)
                    ->whereDate('entry_date', '<=', $asOf);
            })
            ->get();

        $balance = 0.0;
        foreach ($lines as $line) {
            $balance += $this->signedMovement(
                $line->account,
                (float) $line->debit,
                (float) $line->credit,
            );
        }

        return round($balance, 2);
    }

    private function signedMovement(?Account $account, float $debit, float $credit): float
    {
        if ($account === null) {
            return round($debit - $credit, 2);
        }

        // AR (debit normal): debit increases partner balance owed to us.
        // AP (credit normal): credit increases what we owe — report as negative receivable style.
        if ($account->system_role === 'ap_control') {
            return round($credit - $debit, 2) * -1;
        }

        return round($debit - $credit, 2);
    }
}
