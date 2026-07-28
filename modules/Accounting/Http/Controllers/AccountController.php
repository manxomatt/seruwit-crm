<?php

namespace Modules\Accounting\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
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

    public function index(Request $request): Response
    {
        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'type' => ['nullable', 'string', Rule::in(Account::TYPES)],
            'status' => ['nullable', 'string', Rule::in(['active', 'inactive'])],
            'postable' => ['nullable', 'string', Rule::in(['1', '0'])],
        ]);

        $accounts = Account::query()
            ->with('parent:id,code,name')
            ->when(filled($filters['search'] ?? null), function ($query) use ($filters): void {
                $search = (string) $filters['search'];
                $query->where(function ($q) use ($search): void {
                    $q->where('code', 'ilike', "%{$search}%")
                        ->orWhere('name', 'ilike', "%{$search}%")
                        ->orWhere('system_role', 'ilike', "%{$search}%");
                });
            })
            ->when(filled($filters['type'] ?? null), fn ($query) => $query->where('type', $filters['type']))
            ->when(($filters['status'] ?? null) === 'active', fn ($query) => $query->where('is_active', true))
            ->when(($filters['status'] ?? null) === 'inactive', fn ($query) => $query->where('is_active', false))
            ->when(($filters['postable'] ?? null) === '1', fn ($query) => $query->where('is_postable', true))
            ->when(($filters['postable'] ?? null) === '0', fn ($query) => $query->where('is_postable', false))
            ->orderBy('code')
            ->paginate(20)
            ->withQueryString()
            ->through(fn (Account $account): array => [
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
            'filters' => [
                'search' => filled($filters['search'] ?? null) ? (string) $filters['search'] : null,
                'type' => $filters['type'] ?? null,
                'status' => $filters['status'] ?? null,
                'postable' => $filters['postable'] ?? null,
            ],
            'types' => Account::TYPES,
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
