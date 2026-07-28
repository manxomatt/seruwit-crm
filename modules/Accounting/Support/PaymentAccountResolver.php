<?php

namespace Modules\Accounting\Support;

use Illuminate\Support\Facades\Schema;
use Modules\Accounting\Models\Account;
use Modules\Accounting\Models\CompanyBankAccount;
use Modules\Accounting\Models\PaymentMethodAccountMap;

/**
 * Resolves which COA cash/bank account a payment method (or explicit company
 * account) should post to.
 */
class PaymentAccountResolver
{
    public static function tablesReady(): bool
    {
        return Schema::hasTable('company_bank_accounts')
            && Schema::hasTable('payment_method_account_maps');
    }

    public function resolve(SourceEvent $event): ?Account
    {
        if (! self::tablesReady()) {
            return null;
        }

        $companyAccountId = isset($event->context['company_bank_account_id'])
            ? (int) $event->context['company_bank_account_id']
            : null;

        if ($companyAccountId > 0) {
            $company = CompanyBankAccount::query()
                ->with('ledgerAccount')
                ->whereKey($companyAccountId)
                ->where('is_active', true)
                ->first();

            if ($company?->ledgerAccount !== null
                && $company->ledgerAccount->is_active
                && $company->ledgerAccount->is_postable) {
                return $company->ledgerAccount;
            }
        }

        $method = (string) ($event->context['payment_method'] ?? '');

        if ($method !== '') {
            $map = PaymentMethodAccountMap::query()
                ->with('companyBankAccount.ledgerAccount')
                ->where('payment_method', $method)
                ->first();

            $ledger = $map?->companyBankAccount?->ledgerAccount;
            if ($ledger !== null && $ledger->is_active && $ledger->is_postable) {
                return $ledger;
            }
        }

        $kind = $method === 'cash' ? CompanyBankAccount::KIND_CASH : CompanyBankAccount::KIND_BANK;

        $fallback = CompanyBankAccount::query()
            ->with('ledgerAccount')
            ->where('kind', $kind)
            ->where('is_active', true)
            ->orderByDesc('is_default')
            ->orderBy('id')
            ->first();

        $ledger = $fallback?->ledgerAccount;
        if ($ledger !== null && $ledger->is_active && $ledger->is_postable) {
            return $ledger;
        }

        return null;
    }

    /**
     * @return list<array{id: int, name: string, kind: string, account_code: string|null, account_name: string|null}>
     */
    public static function optionsForForms(?string $method = null): array
    {
        if (! self::tablesReady()) {
            return [];
        }

        $query = CompanyBankAccount::query()
            ->with('ledgerAccount:id,code,name')
            ->where('is_active', true)
            ->orderBy('kind')
            ->orderBy('name');

        if ($method === 'cash') {
            $query->where('kind', CompanyBankAccount::KIND_CASH);
        } elseif ($method !== null && $method !== '') {
            $query->where('kind', CompanyBankAccount::KIND_BANK);
        }

        return $query->get()->map(fn (CompanyBankAccount $account): array => [
            'id' => $account->id,
            'name' => $account->name,
            'kind' => $account->kind,
            'account_code' => $account->ledgerAccount?->code,
            'account_name' => $account->ledgerAccount?->name,
        ])->all();
    }
}
