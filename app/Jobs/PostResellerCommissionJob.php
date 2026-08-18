<?php

namespace App\Jobs;

use App\Jobs\Concerns\PostsToOperatorAccounting;
use App\Models\ResellerCommission;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\DB;
use Modules\Accounting\Models\JournalEntry;
use Modules\Accounting\Models\JournalLine;

/**
 * Book a reseller commission as a liability in the operator tenant's ledger.
 *
 * Accrual:
 *   Dr reseller_commission_expense   commission_amount
 *   Cr reseller_commission_payable   net_amount
 *   Cr wht_payable                   tax_withheld_amount   (omitted when zero)
 *
 * Voiding reverses the same entry rather than deleting it, so the ledger keeps
 * both the claim and its withdrawal.
 */
class PostResellerCommissionJob implements ShouldQueue
{
    use PostsToOperatorAccounting, Queueable;

    public int $tries = 3;

    public int $backoff = 60;

    public const EVENT_ACCRUED = 'reseller.commission.accrued';

    public const EVENT_VOIDED = 'reseller.commission.voided';

    public function __construct(
        public readonly int $commissionId,
        public readonly bool $reversal = false,
    ) {}

    public function handle(): void
    {
        $commission = ResellerCommission::with(['tenant', 'reseller'])->find($this->commissionId);

        if ($commission === null) {
            return;
        }

        // A reversal only makes sense for a commission that really was voided,
        // and an accrual only for one that still stands.
        $expectedVoided = $this->reversal;

        if (($commission->status === ResellerCommission::STATUS_VOID) !== $expectedVoided) {
            return;
        }

        $this->inOperatorContext(function () use ($commission): void {
            if (! $this->accountingIsInstalled()) {
                return;
            }

            $this->postEntry($commission);
        });
    }

    private function postEntry(ResellerCommission $commission): void
    {
        $event = $this->reversal ? self::EVENT_VOIDED : self::EVENT_ACCRUED;

        if (JournalEntry::query()
            ->where('source_type', ResellerCommission::class)
            ->where('source_id', $commission->id)
            ->where('event', $event)
            ->exists()) {
            return;
        }

        $expense = $this->accountFor('reseller_commission_expense', 'opex');
        $payable = $this->accountFor('reseller_commission_payable', 'ap_control');

        if (! $expense || ! $payable) {
            \Illuminate\Support\Facades\Log::warning('PostResellerCommissionJob: required accounts not found.', [
                'expense_found' => (bool) $expense,
                'payable_found' => (bool) $payable,
                'hint' => "Create accounts with system_role 'reseller_commission_expense' and 'reseller_commission_payable'.",
            ]);

            return;
        }

        $gross = round((float) $commission->commission_amount, 2);
        $tax = round((float) $commission->tax_withheld_amount, 2);
        $net = round((float) $commission->net_amount, 2);
        $whtAccount = $tax > 0 ? $this->accountFor('wht_payable') : null;

        // Without a withholding account the tax has nowhere to go, so it stays
        // with the payable — the entry still balances and nothing is lost.
        if ($tax > 0 && $whtAccount === null) {
            $net += $tax;
            $tax = 0.0;
        }

        $date = ($this->reversal ? $commission->voided_at : $commission->created_at) ?? now();
        $period = $this->periodFor($date);

        if ($period === null) {
            return;
        }

        $memo = sprintf(
            '%sKomisi reseller %s — %s',
            $this->reversal ? 'Pembatalan ' : '',
            $commission->reseller?->name ?? $commission->reseller_global_id,
            $commission->tenant?->name ?? $commission->tenant_id,
        );

        DB::transaction(function () use ($commission, $event, $period, $expense, $payable, $whtAccount, $gross, $tax, $net, $date, $memo): void {
            $entry = JournalEntry::query()->create([
                'number' => JournalEntry::nextNumber(),
                'fiscal_period_id' => $period->id,
                'entry_date' => \Carbon\Carbon::parse($date)->toDateString(),
                'type' => JournalEntry::TYPE_AUTO,
                'status' => JournalEntry::STATUS_POSTED,
                'source_type' => ResellerCommission::class,
                'source_id' => $commission->id,
                'event' => $event,
                'memo' => $memo,
                'posted_at' => now(),
            ]);

            // On reversal every side simply swaps.
            $lines = [
                ['account' => $expense, 'debit' => $gross, 'credit' => 0.0],
                ['account' => $payable, 'debit' => 0.0, 'credit' => $net],
            ];

            if ($tax > 0 && $whtAccount !== null) {
                $lines[] = ['account' => $whtAccount, 'debit' => 0.0, 'credit' => $tax];
            }

            foreach ($lines as $index => $line) {
                JournalLine::query()->create([
                    'journal_entry_id' => $entry->id,
                    'account_id' => $line['account']->id,
                    'debit' => $this->reversal ? $line['credit'] : $line['debit'],
                    'credit' => $this->reversal ? $line['debit'] : $line['credit'],
                    'sort_order' => $index + 1,
                    'memo' => $memo,
                ]);
            }
        });
    }
}
