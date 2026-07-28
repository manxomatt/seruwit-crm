<?php

namespace Modules\Accounting\Support;

use App\Modules\Facades\Modules;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\ValidationException;
use Modules\Accounting\Models\Account;
use Modules\Accounting\Models\AccountingPostingRule;
use Modules\Accounting\Models\JournalEntry;
use Modules\Accounting\Models\JournalLine;

class AccountingPoster
{
    public function __construct(private readonly FiscalCalendarService $calendar) {}

    public static function isReady(): bool
    {
        return Schema::hasTable('journal_entries')
            && Schema::hasTable('accounts')
            && Schema::hasTable('accounting_posting_rules')
            && Modules::available('accounting');
    }

    public function post(SourceEvent $event): ?JournalEntry
    {
        if (! self::isReady()) {
            return null;
        }

        $existing = $this->findPosted($event->sourceType, $event->sourceId, $event->key);
        if ($existing !== null) {
            return $existing;
        }

        $rules = AccountingPostingRule::forEvent($event->key);
        if ($rules->isEmpty()) {
            throw ValidationException::withMessages([
                'accounting' => __('accounting.validation.posting_rules_missing', ['event' => $event->key]),
            ]);
        }

        $period = $this->calendar->periodForDate($event->occurredAt);
        if (! $period->allowsOperationalPosting()) {
            throw ValidationException::withMessages([
                'accounting' => $period->isHardClosed()
                    ? __('accounting.validation.period_hard_closed')
                    : __('accounting.validation.period_soft_closed'),
            ]);
        }

        $lines = $this->buildLines($event, $rules);
        if ($lines === []) {
            return null;
        }

        $debit = round(array_sum(array_column($lines, 'debit')), 2);
        $credit = round(array_sum(array_column($lines, 'credit')), 2);
        if (abs($debit - $credit) >= 0.005) {
            throw ValidationException::withMessages([
                'accounting' => __('accounting.validation.journal_unbalanced'),
            ]);
        }

        return DB::transaction(function () use ($event, $period, $lines): JournalEntry {
            $again = $this->findPosted($event->sourceType, $event->sourceId, $event->key);
            if ($again !== null) {
                return $again;
            }

            $entry = JournalEntry::query()->create([
                'number' => JournalEntry::nextNumber(),
                'fiscal_period_id' => $period->id,
                'entry_date' => $event->occurredAt,
                'type' => JournalEntry::TYPE_AUTO,
                'status' => JournalEntry::STATUS_POSTED,
                'source_type' => $event->sourceType,
                'source_id' => $event->sourceId,
                'event' => $event->key,
                'memo' => $event->memo,
                'posted_at' => now(),
                'posted_by' => Auth::id(),
                'created_by' => Auth::id(),
            ]);

            foreach ($lines as $index => $line) {
                JournalLine::query()->create([
                    'journal_entry_id' => $entry->id,
                    'account_id' => $line['account_id'],
                    'debit' => $line['debit'],
                    'credit' => $line['credit'],
                    'partner_id' => $event->partnerId,
                    'warehouse_id' => $event->warehouseId,
                    'memo' => $line['memo'] ?? null,
                    'sort_order' => $index + 1,
                ]);
            }

            return $entry->load('lines');
        });
    }

    /**
     * Reverse a previously posted source event (void paths).
     */
    public function reverse(string $sourceType, int $sourceId, string $originalEvent, string $voidEvent, string $occurredAt, ?string $memo = null): ?JournalEntry
    {
        if (! self::isReady()) {
            return null;
        }

        $existingVoid = $this->findPosted($sourceType, $sourceId, $voidEvent);
        if ($existingVoid !== null) {
            return $existingVoid;
        }

        $original = $this->findPosted($sourceType, $sourceId, $originalEvent);
        if ($original === null) {
            return null;
        }

        $period = $this->calendar->periodForDate($occurredAt);
        if (! $period->allowsOperationalPosting()) {
            throw ValidationException::withMessages([
                'accounting' => $period->isHardClosed()
                    ? __('accounting.validation.period_hard_closed')
                    : __('accounting.validation.period_soft_closed'),
            ]);
        }

        $original->loadMissing('lines');

        return DB::transaction(function () use ($original, $period, $sourceType, $sourceId, $voidEvent, $occurredAt, $memo): JournalEntry {
            $again = $this->findPosted($sourceType, $sourceId, $voidEvent);
            if ($again !== null) {
                return $again;
            }

            $entry = JournalEntry::query()->create([
                'number' => JournalEntry::nextNumber(),
                'fiscal_period_id' => $period->id,
                'entry_date' => $occurredAt,
                'type' => JournalEntry::TYPE_REVERSAL,
                'status' => JournalEntry::STATUS_POSTED,
                'source_type' => $sourceType,
                'source_id' => $sourceId,
                'event' => $voidEvent,
                'memo' => $memo ?? __('accounting.messages.reversal_of', ['number' => $original->number]),
                'posted_at' => now(),
                'posted_by' => Auth::id(),
                'created_by' => Auth::id(),
            ]);

            foreach ($original->lines as $index => $line) {
                JournalLine::query()->create([
                    'journal_entry_id' => $entry->id,
                    'account_id' => $line->account_id,
                    'debit' => (float) $line->credit,
                    'credit' => (float) $line->debit,
                    'partner_id' => $line->partner_id,
                    'warehouse_id' => $line->warehouse_id,
                    'memo' => $line->memo,
                    'sort_order' => $index + 1,
                ]);
            }

            $original->update([
                'status' => JournalEntry::STATUS_VOID,
                'voided_at' => now(),
            ]);

            return $entry->load('lines');
        });
    }

    public function findPosted(string $sourceType, int $sourceId, string $event): ?JournalEntry
    {
        return JournalEntry::query()
            ->where('source_type', $sourceType)
            ->where('source_id', $sourceId)
            ->where('event', $event)
            ->where('status', JournalEntry::STATUS_POSTED)
            ->first();
    }

    /**
     * @param  \Illuminate\Support\Collection<int, AccountingPostingRule>  $rules
     * @return list<array{account_id: int, debit: float, credit: float, memo?: string|null}>
     */
    private function buildLines(SourceEvent $event, $rules): array
    {
        $lines = [];

        foreach ($rules as $rule) {
            $amount = $event->amount($rule->amount_key);
            if ($rule->skip_if_zero && $amount < 0.005) {
                continue;
            }

            $account = $this->resolveAccount($rule->system_role, $event);
            $debit = $rule->side === 'debit' ? $amount : 0.0;
            $credit = $rule->side === 'credit' ? $amount : 0.0;

            $lines[] = [
                'account_id' => $account->id,
                'debit' => $debit,
                'credit' => $credit,
                'memo' => null,
            ];
        }

        return $lines;
    }

    private function resolveAccount(string $systemRole, SourceEvent $event): Account
    {
        if ($systemRole === 'payment_cash') {
            $resolved = app(PaymentAccountResolver::class)->resolve($event);
            if ($resolved !== null) {
                return $resolved;
            }

            $fallbackRole = (($event->context['payment_method'] ?? null) === 'cash') ? 'cash' : 'bank';

            $account = Account::query()
                ->where('system_role', $fallbackRole)
                ->where('is_active', true)
                ->where('is_postable', true)
                ->orderBy('code')
                ->first();

            if ($account === null) {
                throw ValidationException::withMessages([
                    'accounting' => __('accounting.validation.account_role_missing', ['role' => $fallbackRole]),
                ]);
            }

            return $account;
        }

        $mapped = $this->resolveMappedTaxAccount($systemRole, $event);
        if ($mapped !== null) {
            return $mapped;
        }

        $resolved = match ($systemRole) {
            'purchase_clearing' => ! empty($event->context['has_grn']) ? 'grni' : 'opex',
            default => $systemRole,
        };

        $account = Account::query()
            ->where('system_role', $resolved)
            ->where('is_active', true)
            ->where('is_postable', true)
            ->orderBy('code')
            ->first();

        if ($account === null) {
            throw ValidationException::withMessages([
                'accounting' => __('accounting.validation.account_role_missing', ['role' => $resolved]),
            ]);
        }

        return $account;
    }

    private function resolveMappedTaxAccount(string $systemRole, SourceEvent $event): ?Account
    {
        $taxCodeId = $event->context['tax_code_id'] ?? $event->context['wht_tax_code_id'] ?? null;
        if ($taxCodeId === null || ! Schema::hasTable('tax_codes')) {
            return null;
        }

        $taxCode = \Modules\Accounting\Models\TaxCode::query()->find((int) $taxCodeId);
        if ($taxCode === null) {
            return null;
        }

        $accountId = match ($systemRole) {
            'tax_output' => $taxCode->output_account_id,
            'tax_input' => $taxCode->input_account_id,
            'wht_payable' => $taxCode->wht_account_id,
            default => null,
        };

        if ($accountId === null) {
            return null;
        }

        return Account::query()
            ->whereKey($accountId)
            ->where('is_active', true)
            ->where('is_postable', true)
            ->first();
    }
}
