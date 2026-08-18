<?php

namespace App\Jobs;

use App\Models\PaymentOrder;
use App\Models\Tenant;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Modules\Accounting\Models\Account;
use Modules\Accounting\Models\FiscalPeriod;
use Modules\Accounting\Models\JournalEntry;
use Modules\Accounting\Models\JournalLine;
use Modules\Accounting\Support\FiscalCalendarService;

/**
 * Post a SaaS subscription payment as a journal entry in the operator tenant's
 * Accounting module.
 *
 * Dr bank (or cash):    total_amount   — money received by the bank
 * Cr saas_revenue:      amount         — plan price (actual revenue)
 * Cr cash_variance:     unique_code    — reconciliation artifact (if non-zero)
 *
 * Required accounts in the operator tenant's chart of accounts:
 *   system_role = 'bank'          (or 'cash' as fallback)
 *   system_role = 'saas_revenue'
 *   system_role = 'cash_variance' (only needed when unique_code > 0)
 */
class PostSaasRevenueJob implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    public int $backoff = 60;

    public function __construct(public readonly int $paymentOrderId) {}

    public function handle(): void
    {
        $operatorTenantId = config('saas.operator_tenant_id');

        $order = PaymentOrder::with(['plan:id,name', 'tenant:id,name'])
            ->find($this->paymentOrderId);

        if (! $order || $order->status !== PaymentOrder::STATUS_CONFIRMED) {
            return;
        }

        if (! $operatorTenantId || $operatorTenantId === 'central') {
            // Post directly to Central Admin Accounting
            $this->postEntry($order);

            return;
        }

        $operatorTenant = Tenant::query()->find($operatorTenantId);

        if (! $operatorTenant) {
            Log::warning('PostSaasRevenueJob: operator tenant not found. Falling back to Central.', [
                'operator_tenant_id' => $operatorTenantId,
            ]);

            $this->postEntry($order);

            return;
        }

        $operatorTenant->run(function () use ($order): void {
            $this->postEntry($order);
        });
    }

    private function postEntry(PaymentOrder $order): void
    {
        if (! Schema::hasTable('journal_entries') || ! Schema::hasTable('accounts')) {
            Log::warning('PostSaasRevenueJob: Accounting tables missing in operator tenant. Install the Accounting module first.');

            return;
        }

        // Idempotency guard — never double-post the same order.
        if (JournalEntry::query()
            ->where('source_type', PaymentOrder::class)
            ->where('source_id', $order->id)
            ->where('event', 'saas.subscription.confirmed')
            ->exists()) {
            return;
        }

        $bankAccount = Account::query()
            ->where('system_role', 'bank')
            ->where('is_active', true)
            ->first()
            ?? Account::query()
                ->where('system_role', 'cash')
                ->where('is_active', true)
                ->first();

        $revenueAccount = Account::query()
            ->where('system_role', 'saas_revenue')
            ->where('is_active', true)
            ->first()
            ?? Account::query()
                ->where('system_role', 'sales_revenue')
                ->where('is_active', true)
                ->first();

        if (! $bankAccount || ! $revenueAccount) {
            Log::warning('PostSaasRevenueJob: Required accounts not found in operator tenant.', [
                'bank_account_found' => (bool) $bankAccount,
                'saas_revenue_account_found' => (bool) $revenueAccount,
                'hint' => "Create accounts with system_role 'bank' and 'saas_revenue' in the operator tenant's chart of accounts.",
            ]);

            return;
        }

        $period = $this->resolvePeriod($order);

        if ($period === null || ! $period->allowsPosting()) {
            Log::warning('PostSaasRevenueJob: Current fiscal period does not allow posting.', [
                'period_id' => $period?->id,
                'period_status' => $period?->status,
            ]);

            return;
        }

        $amount = round((float) $order->amount, 2);
        $uniqueCode = (int) $order->unique_code;
        $totalAmount = round((float) $order->total_amount, 2);
        $entryDate = $order->confirmed_at ? $order->confirmed_at->toDateString() : now()->toDateString();

        $memo = sprintf(
            'Subscription %s — %s (%s)',
            $order->plan?->name ?? 'Plan',
            $order->tenant?->name ?? $order->tenant_id,
            $order->type === 'renew' ? 'perpanjang' : 'aktivasi',
        );

        DB::transaction(function () use ($order, $period, $bankAccount, $revenueAccount, $amount, $uniqueCode, $totalAmount, $entryDate, $memo): void {
            $entry = JournalEntry::query()->create([
                'number' => JournalEntry::nextNumber(),
                'fiscal_period_id' => $period->id,
                'entry_date' => $entryDate,
                'type' => JournalEntry::TYPE_AUTO,
                'status' => JournalEntry::STATUS_POSTED,
                'source_type' => PaymentOrder::class,
                'source_id' => $order->id,
                'event' => 'saas.subscription.confirmed',
                'memo' => $memo,
                'posted_at' => now(),
            ]);

            // Dr bank / cash — total money received in bank
            JournalLine::query()->create([
                'journal_entry_id' => $entry->id,
                'account_id' => $bankAccount->id,
                'debit' => $totalAmount,
                'credit' => 0,
                'sort_order' => 1,
                'memo' => $memo,
            ]);

            if ($uniqueCode > 0) {
                // Cr saas_revenue — actual plan price
                JournalLine::query()->create([
                    'journal_entry_id' => $entry->id,
                    'account_id' => $revenueAccount->id,
                    'debit' => 0,
                    'credit' => $amount,
                    'sort_order' => 2,
                    'memo' => $memo,
                ]);

                // Cr cash_variance — reconciliation unique code
                $varianceAccount = Account::query()
                    ->where('system_role', 'cash_variance')
                    ->where('is_active', true)
                    ->first();

                JournalLine::query()->create([
                    'journal_entry_id' => $entry->id,
                    'account_id' => ($varianceAccount ?? $revenueAccount)->id,
                    'debit' => 0,
                    'credit' => $uniqueCode,
                    'sort_order' => 3,
                    'memo' => "Kode unik transfer #{$order->id}",
                ]);
            } else {
                // No unique code: simple two-line entry
                JournalLine::query()->create([
                    'journal_entry_id' => $entry->id,
                    'account_id' => $revenueAccount->id,
                    'debit' => 0,
                    'credit' => $totalAmount,
                    'sort_order' => 2,
                    'memo' => $memo,
                ]);
            }
        });
    }

    private function resolvePeriod(?PaymentOrder $order = null): ?FiscalPeriod
    {
        try {
            $date = $order?->confirmed_at ? \Carbon\Carbon::parse($order->confirmed_at) : now();

            return app(FiscalCalendarService::class)->periodForDate($date);
        } catch (\Throwable $e) {
            Log::warning('PostSaasRevenueJob: Could not resolve fiscal period.', [
                'error' => $e->getMessage(),
            ]);

            return null;
        }
    }
}
