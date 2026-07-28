<?php

namespace Modules\Accounting\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Inertia\Response;
use Modules\Accounting\Http\Requests\StoreCompanyBankAccountRequest;
use Modules\Accounting\Http\Requests\UpdateCompanyBankAccountRequest;
use Modules\Accounting\Http\Requests\UpdatePaymentMethodMapsRequest;
use Modules\Accounting\Models\Account;
use Modules\Accounting\Models\CompanyBankAccount;
use Modules\Accounting\Models\PaymentMethodAccountMap;

class CompanyBankAccountController extends Controller
{
    public function getRoutePrefix(): string
    {
        return 'module';
    }

    public function index(): Response
    {
        $accounts = CompanyBankAccount::query()
            ->with('ledgerAccount:id,code,name')
            ->orderBy('kind')
            ->orderBy('name')
            ->get()
            ->map(fn (CompanyBankAccount $account): array => [
                'id' => $account->id,
                'name' => $account->name,
                'kind' => $account->kind,
                'bank_name' => $account->bank_name,
                'account_number' => $account->account_number,
                'account_holder' => $account->account_holder,
                'is_default' => $account->is_default,
                'is_active' => $account->is_active,
                'currency' => $account->currency,
                'ledger' => $account->ledgerAccount
                    ? ['id' => $account->ledgerAccount->id, 'code' => $account->ledgerAccount->code, 'name' => $account->ledgerAccount->name]
                    : null,
            ]);

        $maps = PaymentMethodAccountMap::query()
            ->with('companyBankAccount:id,name,kind')
            ->orderBy('payment_method')
            ->get()
            ->map(fn (PaymentMethodAccountMap $map): array => [
                'payment_method' => $map->payment_method,
                'company_bank_account_id' => $map->company_bank_account_id,
                'company_bank_account' => $map->companyBankAccount
                    ? ['id' => $map->companyBankAccount->id, 'name' => $map->companyBankAccount->name, 'kind' => $map->companyBankAccount->kind]
                    : null,
            ]);

        return inertia('Modules/Accounting/BankAccounts/Index', [
            'accounts' => $accounts,
            'methods' => PaymentMethodAccountMap::METHODS,
            'maps' => $maps,
            'can' => [
                'bank' => auth()->user()?->hasPermissionFor('accounting', 'bank') ?? false,
            ],
        ]);
    }

    public function create(): Response
    {
        return inertia('Modules/Accounting/BankAccounts/Create', [
            'kinds' => CompanyBankAccount::KINDS,
            'ledgerAccounts' => $this->assetAccounts(),
        ]);
    }

    public function store(StoreCompanyBankAccountRequest $request): RedirectResponse
    {
        $data = $request->validated();
        $data['currency'] = $data['currency'] ?? 'IDR';
        $data['is_default'] = (bool) ($data['is_default'] ?? false);
        $data['is_active'] = (bool) ($data['is_active'] ?? true);

        DB::transaction(function () use ($data): void {
            if ($data['is_default']) {
                CompanyBankAccount::query()
                    ->where('kind', $data['kind'])
                    ->update(['is_default' => false]);
            }

            CompanyBankAccount::query()->create($data);
        });

        return redirect()
            ->route($this->getRoutePrefix().'.accounting.bank-accounts.index')
            ->with('success', __('accounting.messages.bank_account_created'));
    }

    public function edit(CompanyBankAccount $bankAccount): Response
    {
        return inertia('Modules/Accounting/BankAccounts/Edit', [
            'account' => $bankAccount->only([
                'id', 'name', 'kind', 'bank_name', 'account_number', 'account_holder',
                'account_id', 'is_default', 'is_active', 'currency',
            ]),
            'kinds' => CompanyBankAccount::KINDS,
            'ledgerAccounts' => $this->assetAccounts(),
        ]);
    }

    public function update(UpdateCompanyBankAccountRequest $request, CompanyBankAccount $bankAccount): RedirectResponse
    {
        $data = $request->validated();
        $data['currency'] = $data['currency'] ?? 'IDR';
        $data['is_default'] = (bool) ($data['is_default'] ?? false);
        $data['is_active'] = (bool) ($data['is_active'] ?? true);

        DB::transaction(function () use ($bankAccount, $data): void {
            if ($data['is_default']) {
                CompanyBankAccount::query()
                    ->where('kind', $data['kind'])
                    ->where('id', '!=', $bankAccount->id)
                    ->update(['is_default' => false]);
            }

            $bankAccount->update($data);
        });

        return redirect()
            ->route($this->getRoutePrefix().'.accounting.bank-accounts.index')
            ->with('success', __('accounting.messages.bank_account_updated'));
    }

    public function updateMaps(UpdatePaymentMethodMapsRequest $request): RedirectResponse
    {
        foreach ($request->validated('maps') as $row) {
            PaymentMethodAccountMap::query()->updateOrCreate(
                ['payment_method' => $row['payment_method']],
                ['company_bank_account_id' => $row['company_bank_account_id']],
            );
        }

        return back()->with('success', __('accounting.messages.payment_maps_updated'));
    }

    /**
     * @return list<array{id: int, code: string, name: string}>
     */
    private function assetAccounts(): array
    {
        return Account::query()
            ->where('type', Account::TYPE_ASSET)
            ->where('is_active', true)
            ->where('is_postable', true)
            ->orderBy('code')
            ->get(['id', 'code', 'name'])
            ->map(fn (Account $account): array => [
                'id' => $account->id,
                'code' => $account->code,
                'name' => $account->name,
            ])
            ->all();
    }
}
