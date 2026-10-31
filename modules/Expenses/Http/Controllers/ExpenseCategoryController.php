<?php

namespace Modules\Expenses\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Accounting\Models\Account;
use Modules\Expenses\Http\Requests\StoreExpenseCategoryRequest;
use Modules\Expenses\Http\Requests\UpdateExpenseCategoryRequest;
use Modules\Expenses\Models\ExpenseCategory;
use Modules\Expenses\Support\ExpenseSchemaInitializer;

class ExpenseCategoryController extends Controller
{
    public function index(Request $request): Response
    {
        ExpenseSchemaInitializer::ensureReady();

        $categories = ExpenseCategory::query()
            ->with('account:id,code,name')
            ->withCount('claimLines')
            ->orderBy('code')
            ->get()
            ->map(fn (ExpenseCategory $cat): array => [
                'id' => $cat->id,
                'code' => $cat->code,
                'name' => $cat->name,
                'account_id' => $cat->account_id,
                'is_active' => $cat->is_active,
                'description' => $cat->description,
                'claim_lines_count' => $cat->claim_lines_count,
                'account' => $cat->account
                    ? ['id' => $cat->account->id, 'code' => $cat->account->code, 'name' => $cat->account->name]
                    : null,
            ]);

        $accounts = Account::query()
            ->where('type', Account::TYPE_EXPENSE)
            ->where('is_active', true)
            ->where('is_postable', true)
            ->orderBy('code')
            ->get(['id', 'code', 'name']);

        $user = $request->user();

        return Inertia::render('Modules/Expenses/Categories/Index', [
            'categories' => $categories,
            'accounts' => $accounts,
            'can' => [
                'manage' => ($user?->hasPermissionFor('expenses', 'create') ?? false)
                    || ($user?->hasPermissionFor('expenses', 'update') ?? false)
                    || ($user?->isAdmin() ?? false),
            ],
        ]);
    }

    public function store(StoreExpenseCategoryRequest $request): RedirectResponse
    {
        ExpenseSchemaInitializer::ensureReady();

        $data = $request->validated();
        $data['code'] = strtoupper((string) $data['code']);
        $data['is_active'] = (bool) ($data['is_active'] ?? true);

        ExpenseCategory::query()->create($data);

        return back()->with('success', 'Kategori biaya berhasil ditambahkan.');
    }

    public function update(UpdateExpenseCategoryRequest $request, ExpenseCategory $category): RedirectResponse
    {
        $data = $request->validated();
        $data['code'] = strtoupper((string) $data['code']);
        $data['is_active'] = (bool) ($data['is_active'] ?? true);

        $category->update($data);

        return back()->with('success', 'Kategori biaya berhasil diperbarui.');
    }
}
