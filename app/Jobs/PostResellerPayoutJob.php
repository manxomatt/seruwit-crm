<?php

namespace App\Jobs;

use App\Jobs\Concerns\PostsToOperatorAccounting;
use App\Models\ResellerPayout;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Modules\Accounting\Models\JournalEntry;
use Modules\Accounting\Models\JournalLine;

/**
 * Settle a paid reseller batch against the bank.
 *
 * Dr reseller_commission_payable   net_amount
 * Cr bank                          net_amount
 *
 * Only the net leaves the bank: the withheld tax was already parked in
 * wht_payable at accrual and is remitted separately.
 */
class PostResellerPayoutJob implements ShouldQueue
{
    use PostsToOperatorAccounting, Queueable;

    public int $tries = 3;

    public int $backoff = 60;

    public const EVENT = 'reseller.payout.paid';

    public function __construct(public readonly int $payoutId) {}

    public function handle(): void
    {
        $payout = ResellerPayout::with('reseller')->find($this->payoutId);

        if ($payout === null || $payout->status !== ResellerPayout::STATUS_PAID) {
            return;
        }

        $this->inOperatorContext(function () use ($payout): void {
            if (! $this->accountingIsInstalled()) {
                return;
            }

            $this->postEntry($payout);
        });
    }

    private function postEntry(ResellerPayout $payout): void
    {
        if (JournalEntry::query()
            ->where('source_type', ResellerPayout::class)
            ->where('source_id', $payout->id)
            ->where('event', self::EVENT)
            ->exists()) {
            return;
        }

        $payable = $this->accountFor('reseller_commission_payable', 'ap_control');
        $bank = $this->accountFor('bank', 'cash');

        if (! $payable || ! $bank) {
            Log::warning('PostResellerPayoutJob: required accounts not found.', [
                'payable_found' => (bool) $payable,
                'bank_found' => (bool) $bank,
            ]);

            return;
        }

        $date = $payout->paid_at ?? now();
        $period = $this->periodFor($date);

        if ($period === null) {
            return;
        }

        $net = round((float) $payout->net_amount, 2);
        $memo = sprintf(
            'Pembayaran komisi %s — %s',
            $payout->reference,
            $payout->reseller?->name ?? $payout->reseller_global_id,
        );

        DB::transaction(function () use ($payout, $period, $payable, $bank, $net, $date, $memo): void {
            $entry = JournalEntry::query()->create([
                'number' => JournalEntry::nextNumber(),
                'fiscal_period_id' => $period->id,
                'entry_date' => \Carbon\Carbon::parse($date)->toDateString(),
                'type' => JournalEntry::TYPE_AUTO,
                'status' => JournalEntry::STATUS_POSTED,
                'source_type' => ResellerPayout::class,
                'source_id' => $payout->id,
                'event' => self::EVENT,
                'memo' => $memo,
                'posted_at' => now(),
            ]);

            JournalLine::query()->create([
                'journal_entry_id' => $entry->id,
                'account_id' => $payable->id,
                'debit' => $net,
                'credit' => 0,
                'sort_order' => 1,
                'memo' => $memo,
            ]);

            JournalLine::query()->create([
                'journal_entry_id' => $entry->id,
                'account_id' => $bank->id,
                'debit' => 0,
                'credit' => $net,
                'sort_order' => 2,
                'memo' => $memo,
            ]);
        });
    }
}
