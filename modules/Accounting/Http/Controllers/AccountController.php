<?php

namespace Modules\Accounting\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Inertia\Response;
use Modules\Accounting\Http\Requests\StoreAccountRequest;
use Modules\Accounting\Http\Requests\UpdateAccountRequest;
use Modules\Accounting\Models\Account;

class AccountController extends Controller
{
    public function getRoutePrefix(): string
    {
        return 'module';
    }

    public function index(): Response
    {
        $accounts = Account::query()
            ->with('parent:id,code,name')
            ->orderBy('code')
            ->get()
            ->map(fn (Account $account): array => [
                'id' => $account->id,
                'code' => $account->code,
                'name' => $account->name,
                'type' => $account->type,
                'parent' => $account->parent
                    ? ['id' => $account->parent->id, 'code' => $account->parent->code, 'name' => $account->parent->name]
                    : null,
                'is_postable' => $account->is_postable,
                'is_active' => $account->is_active,
                'normal_balance' => $account->normal_balance,
                'system_role' => $account->system_role,
            ]);

        return inertia('Modules/Accounting/Accounts/Index', [
            'accounts' => $accounts,
            'can' => [
                'manage_coa' => auth()->user()?->hasPermissionFor('accounting', 'manage_coa') ?? false,
            ],
        ]);
    }

    public function create(): Response
    {
        return inertia('Modules/Accounting/Accounts/Create', [
            'types' => Account::TYPES,
            'parents' => Account::query()->orderBy('code')->get(['id', 'code', 'name']),
        ]);
    }

    public function store(StoreAccountRequest $request): RedirectResponse
    {
        $data = $request->validated();
        $data['normal_balance'] = $data['normal_balance'] ?? Account::defaultNormalBalance($data['type']);
        $data['currency'] = $data['currency'] ?? 'IDR';
        $data['is_postable'] = $data['is_postable'] ?? true;
        $data['is_active'] = $data['is_active'] ?? true;

        Account::query()->create($data);

        return redirect()
            ->route($this->getRoutePrefix().'.accounting.accounts.index')
            ->with('success', __('accounting.messages.account_created'));
    }

    public function edit(Account $account): Response
    {
        return inertia('Modules/Accounting/Accounts/Edit', [
            'account' => $account->only([
                'id', 'code', 'name', 'type', 'parent_id', 'is_postable', 'is_active',
                'normal_balance', 'currency', 'system_role',
            ]),
            'types' => Account::TYPES,
            'parents' => Account::query()
                ->where('id', '!=', $account->id)
                ->orderBy('code')
                ->get(['id', 'code', 'name']),
        ]);
    }

    public function update(UpdateAccountRequest $request, Account $account): RedirectResponse
    {
        $data = $request->validated();
        $data['normal_balance'] = $data['normal_balance'] ?? Account::defaultNormalBalance($data['type']);
        $data['currency'] = $data['currency'] ?? 'IDR';

        $account->update($data);

        return redirect()
            ->route($this->getRoutePrefix().'.accounting.accounts.index')
            ->with('success', __('accounting.messages.account_updated'));
    }
}
