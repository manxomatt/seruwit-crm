<?php

namespace App\Jobs\Concerns;

use App\Models\Tenant;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Modules\Accounting\Models\Account;
use Modules\Accounting\Models\FiscalPeriod;
use Modules\Accounting\Support\FiscalCalendarService;

/**
 * Shared plumbing for jobs that write journal entries into the tenant that
 * operates this platform.
 *
 * Every one of these postings is bookkeeping *about* the SaaS business, not
 * about any customer's workspace, so they all land in one place — and they all
 * have to degrade the same way when the operator has no Accounting module:
 * log and stop, never fail the business action that triggered them.
 */
trait PostsToOperatorAccounting
{
    /**
     * Run the posting inside the operator tenant's context, falling back to the
     * central schema when no operator tenant is configured.
     */
    protected function inOperatorContext(callable $callback): void
    {
        $operatorTenantId = config('saas.operator_tenant_id');

        if (! $operatorTenantId || $operatorTenantId === 'central') {
            $callback();

            return;
        }

        $operatorTenant = Tenant::query()->find($operatorTenantId);

        if (! $operatorTenant) {
            Log::warning(static::class.': operator tenant not found. Falling back to Central.', [
                'operator_tenant_id' => $operatorTenantId,
            ]);

            $callback();

            return;
        }

        $operatorTenant->run(fn () => $callback());
    }

    protected function accountingIsInstalled(): bool
    {
        if (Schema::hasTable('journal_entries') && Schema::hasTable('accounts')) {
            return true;
        }

        Log::warning(static::class.': Accounting tables missing in operator tenant. Install the Accounting module first.');

        return false;
    }

    /**
     * First active account matching any of the given system roles, in order.
     */
    protected function accountFor(string ...$systemRoles): ?Account
    {
        foreach ($systemRoles as $role) {
            $account = Account::query()
                ->where('system_role', $role)
                ->where('is_active', true)
                ->first();

            if ($account !== null) {
                return $account;
            }
        }

        return null;
    }

    protected function periodFor(\DateTimeInterface $date): ?FiscalPeriod
    {
        try {
            $period = app(FiscalCalendarService::class)->periodForDate(\Carbon\Carbon::parse($date));
        } catch (\Throwable $e) {
            Log::warning(static::class.': Could not resolve fiscal period.', ['error' => $e->getMessage()]);

            return null;
        }

        if ($period === null || ! $period->allowsPosting()) {
            Log::warning(static::class.': Fiscal period does not allow posting.', [
                'period_id' => $period?->id,
                'period_status' => $period?->status,
            ]);

            return null;
        }

        return $period;
    }
}
