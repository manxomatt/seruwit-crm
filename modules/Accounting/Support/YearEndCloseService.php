<?php

namespace Modules\Accounting\Support;

use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Modules\Accounting\Models\Account;
use Modules\Accounting\Models\FiscalPeriod;
use Modules\Accounting\Models\FiscalYear;
use Modules\Accounting\Models\JournalEntry;

class YearEndCloseService
{
    public function __construct(
        private readonly FiscalCalendarService $calendar,
        private readonly JournalService $journals,
        private readonly GlBalanceAggregator $aggregator,
    ) {}

    public function findClosing(FiscalYear $year): ?JournalEntry
    {
        return JournalEntry::query()
            ->where('source_type', $year->getMorphClass())
            ->where('source_id', (int) $year->id)
            ->where('event', 'year.closed')
            ->where('status', JournalEntry::STATUS_POSTED)
            ->first();
    }

    public function close(FiscalYear $year, ?int $userId = null): ?JournalEntry
    {
        $year->load('periods');

        if ($year->is_closed) {
            throw ValidationException::withMessages([
                'year' => __('accounting.validation.year_already_closed'),
            ]);
        }

        $existing = $this->findClosing($year);
        if ($existing !== null) {
            $year->update(['is_closed' => true]);

            return $existing;
        }

        foreach ($year->periods as $period) {
            if ((int) $period->period_index === 12) {
                continue;
            }
            if (! $period->isHardClosed()) {
                $this->calendar->hardClose($period);
            }
        }

        $december = $year->periods->firstWhere('period_index', 12);
        if ($december === null) {
            throw ValidationException::withMessages([
                'year' => __('accounting.validation.period_not_found'),
            ]);
        }

        if ($december->status !== FiscalPeriod::STATUS_OPEN) {
            $december->update(['status' => FiscalPeriod::STATUS_OPEN]);
        }

        $retained = Account::query()
            ->where('system_role', 'retained_earnings')
            ->where('is_active', true)
            ->where('is_postable', true)
            ->orderBy('code')
            ->first();

        if ($retained === null) {
            throw ValidationException::withMessages([
                'year' => __('accounting.validation.account_role_missing', ['role' => 'retained_earnings']),
            ]);
        }

        $lines = $this->buildClosingLines($year, $retained);
        $userId ??= Auth::id();

        return DB::transaction(function () use ($year, $december, $lines, $userId): ?JournalEntry {
            $posted = null;

            if ($lines !== []) {
                $entry = $this->journals->createDraft([
                    'entry_date' => $year->ends_on->toDateString(),
                    'type' => JournalEntry::TYPE_CLOSING,
                    'memo' => __('accounting.messages.year_close_memo', ['year' => (string) $year->year]),
                    'lines' => $lines,
                ], $userId);

                $entry->update([
                    'source_type' => $year->getMorphClass(),
                    'source_id' => (int) $year->id,
                    'event' => 'year.closed',
                ]);

                $posted = $this->journals->post($entry, $userId);
            }

            $this->calendar->hardClose($december->fresh());
            $year->update(['is_closed' => true]);
            $this->calendar->ensureYear($year->year + 1);

            return $posted;
        });
    }

    public function reopen(FiscalYear $year, ?int $userId = null): void
    {
        if (! $year->is_closed) {
            throw ValidationException::withMessages([
                'year' => __('accounting.validation.year_not_closed'),
            ]);
        }

        $year->load('periods');
        $december = $year->periods->firstWhere('period_index', 12);
        $userId ??= Auth::id();

        DB::transaction(function () use ($year, $december, $userId): void {
            $year->update(['is_closed' => false]);

            if ($december !== null) {
                $december->update(['status' => FiscalPeriod::STATUS_OPEN]);
            }

            $closing = $this->findClosing($year);
            if ($closing !== null) {
                $voidExists = JournalEntry::query()
                    ->where('source_type', $year->getMorphClass())
                    ->where('source_id', (int) $year->id)
                    ->where('event', 'year.reopened')
                    ->where('status', JournalEntry::STATUS_POSTED)
                    ->exists();

                if (! $voidExists) {
                    $closing->loadMissing('lines');
                    $lines = $closing->lines->map(fn ($line): array => [
                        'account_id' => (int) $line->account_id,
                        'debit' => (float) $line->credit,
                        'credit' => (float) $line->debit,
                        'memo' => $line->memo,
                    ])->values()->all();

                    $reversal = $this->journals->createDraft([
                        'entry_date' => $year->ends_on->toDateString(),
                        'type' => JournalEntry::TYPE_REVERSAL,
                        'memo' => __('accounting.messages.year_reopen_memo', ['year' => (string) $year->year]),
                        'lines' => $lines,
                    ], $userId);

                    $reversal->update([
                        'source_type' => $year->getMorphClass(),
                        'source_id' => (int) $year->id,
                        'event' => 'year.reopened',
                    ]);

                    $this->journals->post($reversal, $userId);

                    $closing->update([
                        'status' => JournalEntry::STATUS_VOID,
                        'voided_at' => now(),
                    ]);
                }
            }

            if ($december !== null) {
                $december->fresh()?->update(['status' => FiscalPeriod::STATUS_SOFT_CLOSE]);
            }
        });
    }

    /**
     * @return list<array{account_id: int, debit: float, credit: float}>
     */
    private function buildClosingLines(FiscalYear $year, Account $retained): array
    {
        $aggregates = $this->aggregator->aggregates([
            'from' => $year->starts_on->toDateString(),
            'as_of' => $year->ends_on->toDateString(),
        ]);

        $accounts = Account::query()
            ->where('is_postable', true)
            ->whereIn('type', [
                Account::TYPE_REVENUE,
                Account::TYPE_CONTRA_REVENUE,
                Account::TYPE_EXPENSE,
            ])
            ->orderBy('code')
            ->get();

        $lines = [];
        $netToRetained = 0.0;

        foreach ($accounts as $account) {
            $agg = $aggregates->get($account->id);
            $debit = round((float) ($agg->debit_total ?? 0), 2);
            $credit = round((float) ($agg->credit_total ?? 0), 2);
            if ($debit <= 0 && $credit <= 0) {
                continue;
            }

            $contribution = round($credit - $debit, 2);
            if (abs($contribution) < 0.005) {
                continue;
            }

            if ($contribution > 0) {
                $lines[] = [
                    'account_id' => $account->id,
                    'debit' => $contribution,
                    'credit' => 0.0,
                ];
                $netToRetained += $contribution;
            } else {
                $amount = abs($contribution);
                $lines[] = [
                    'account_id' => $account->id,
                    'debit' => 0.0,
                    'credit' => $amount,
                ];
                $netToRetained -= $amount;
            }
        }

        $netToRetained = round($netToRetained, 2);

        if ($lines === []) {
            return [];
        }

        if ($netToRetained >= 0.005) {
            $lines[] = [
                'account_id' => $retained->id,
                'debit' => 0.0,
                'credit' => $netToRetained,
            ];
        } elseif ($netToRetained <= -0.005) {
            $lines[] = [
                'account_id' => $retained->id,
                'debit' => abs($netToRetained),
                'credit' => 0.0,
            ];
        }

        return $lines;
    }
}
