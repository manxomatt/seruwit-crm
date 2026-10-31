<?php

namespace Modules\Expenses\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Accounting\Models\Account;
use Modules\Accounting\Models\CompanyBankAccount;
use Modules\Accounting\Models\JournalEntry;
use Modules\Accounting\Models\PaymentMethodAccountMap;
use Modules\Expenses\Http\Requests\StoreExpenseClaimRequest;
use Modules\Expenses\Models\ExpenseCategory;
use Modules\Expenses\Models\ExpenseClaim;
use Modules\Expenses\Models\ExpenseClaimLine;
use Modules\Expenses\Support\ExpenseSchemaInitializer;
use Modules\Expenses\Support\ExpenseService;
use Modules\Fleet\Models\Vehicle;
use Modules\Partners\Models\Partner;

class ExpenseClaimController extends Controller
{
    public function getRoutePrefix(): string
    {
        return 'module';
    }

    public function index(Request $request): Response
    {
        ExpenseSchemaInitializer::ensureReady();

        $status = (string) $request->string('status', '');
        $type = (string) $request->string('type', '');
        $search = trim((string) $request->string('search', ''));

        $claims = ExpenseClaim::query()
            ->with([
                'companyBankAccount:id,name,kind',
                'partner:id,name',
                'lines.category:id,code,name',
                'lines.account:id,code,name',
            ])
            ->when($status !== '', fn ($q) => $q->where('status', $status))
            ->when($type !== '', fn ($q) => $q->where('type', $type))
            ->when($search !== '', function ($q) use ($search): void {
                $q->where(function ($sub) use ($search): void {
                    $sub->where('code', 'like', "%{$search}%")
                        ->orWhere('title', 'like', "%{$search}%")
                        ->orWhere('reference_number', 'like', "%{$search}%");
                });
            })
            ->latest('expense_date')
            ->latest('id')
            ->paginate(20)
            ->withQueryString()
            ->through(fn (ExpenseClaim $claim): array => [
                'id' => $claim->id,
                'code' => $claim->code,
                'expense_date' => $claim->expense_date?->toDateString(),
                'type' => $claim->type,
                'title' => $claim->title,
                'payment_method' => $claim->payment_method,
                'total_amount' => (float) $claim->total_amount,
                'status' => $claim->status,
                'reference_number' => $claim->reference_number,
                'bank_account' => $claim->companyBankAccount
                    ? ['id' => $claim->companyBankAccount->id, 'name' => $claim->companyBankAccount->name, 'kind' => $claim->companyBankAccount->kind]
                    : null,
                'partner_name' => $claim->partner?->name,
                'lines_count' => $claim->lines->count(),
                'categories' => $claim->lines
                    ->map(fn (ExpenseClaimLine $l) => $l->category?->name)
                    ->filter()
                    ->unique()
                    ->values()
                    ->all(),
            ]);

        $user = $request->user();

        return Inertia::render('Modules/Expenses/Claims/Index', [
            'claims' => $claims,
            'types' => ExpenseClaim::TYPES,
            'statuses' => ExpenseClaim::STATUSES,
            'filters' => [
                'status' => $status ?: null,
                'type' => $type ?: null,
                'search' => $search ?: null,
            ],
            'can' => [
                'create' => ($user?->hasPermissionFor('expenses', 'create') ?? false) || ($user?->isAdmin() ?? false),
                'post' => ($user?->hasPermissionFor('expenses', 'post') ?? false) || ($user?->isAdmin() ?? false),
            ],
        ]);
    }

    public function create(): Response
    {
        ExpenseSchemaInitializer::ensureReady();

        return Inertia::render('Modules/Expenses/Claims/Create', [
            'suggestedCode' => ExpenseClaim::nextCode(),
            'types' => [
                ExpenseClaim::TYPE_DIRECT,
                ExpenseClaim::TYPE_PETTY_CASH,
                ExpenseClaim::TYPE_REIMBURSEMENT,
            ],
            'paymentMethods' => PaymentMethodAccountMap::METHODS,
            'categories' => ExpenseCategory::query()
                ->where('is_active', true)
                ->orderBy('code')
                ->get(['id', 'code', 'name', 'account_id']),
            'accounts' => Account::query()
                ->where('type', Account::TYPE_EXPENSE)
                ->where('is_active', true)
                ->where('is_postable', true)
                ->orderBy('code')
                ->get(['id', 'code', 'name']),
            'bankAccounts' => CompanyBankAccount::query()
                ->where('is_active', true)
                ->orderBy('kind')
                ->orderBy('name')
                ->get(['id', 'name', 'kind']),
            'partners' => Schema::hasTable('partners')
                ? Partner::query()->orderBy('name')->limit(100)->get(['id', 'name'])
                : [],
            'vehicles' => Schema::hasTable('vehicles')
                ? Vehicle::query()->orderBy('plate_number')->limit(100)->get(['id', 'name', 'plate_number'])
                : [],
        ]);
    }

    public function store(StoreExpenseClaimRequest $request, ExpenseService $service): RedirectResponse
    {
        $claim = $service->create($request->validated(), $request->user()?->id);

        return redirect()
            ->route($this->getRoutePrefix().'.expenses.claims.show', $claim)
            ->with('success', "Voucher pengeluaran {$claim->code} berhasil disimpan.");
    }

    public function show(Request $request, ExpenseClaim $claim): Response
    {
        ExpenseSchemaInitializer::ensureReady();

        $claim->load([
            'lines.category:id,code,name',
            'lines.account:id,code,name',
            'companyBankAccount:id,name,kind',
            'partner:id,name',
            'cashAdvance:id,code,purpose',
        ]);

        $journal = JournalEntry::query()
            ->where('source_type', $claim->getMorphClass())
            ->where('source_id', $claim->id)
            ->with('lines.account:id,code,name')
            ->latest('id')
            ->first();

        $user = $request->user();

        return Inertia::render('Modules/Expenses/Claims/Show', [
            'claim' => [
                'id' => $claim->id,
                'code' => $claim->code,
                'expense_date' => $claim->expense_date?->toDateString(),
                'type' => $claim->type,
                'title' => $claim->title,
                'payment_method' => $claim->payment_method,
                'total_amount' => (float) $claim->total_amount,
                'status' => $claim->status,
                'reference_number' => $claim->reference_number,
                'notes' => $claim->notes,
                'posted_at' => $claim->posted_at?->toDateTimeString(),
                'voided_at' => $claim->voided_at?->toDateTimeString(),
                'bank_account' => $claim->companyBankAccount
                    ? ['id' => $claim->companyBankAccount->id, 'name' => $claim->companyBankAccount->name, 'kind' => $claim->companyBankAccount->kind]
                    : null,
                'partner' => $claim->partner
                    ? ['id' => $claim->partner->id, 'name' => $claim->partner->name]
                    : null,
                'cash_advance' => $claim->cashAdvance
                    ? ['id' => $claim->cashAdvance->id, 'code' => $claim->cashAdvance->code, 'purpose' => $claim->cashAdvance->purpose]
                    : null,
                'lines' => $claim->lines->map(fn (ExpenseClaimLine $line): array => [
                    'id' => $line->id,
                    'description' => $line->description,
                    'amount' => (float) $line->amount,
                    'receipt_number' => $line->receipt_number,
                    'category' => $line->category
                        ? ['id' => $line->category->id, 'code' => $line->category->code, 'name' => $line->category->name]
                        : null,
                    'account' => $line->account
                        ? ['id' => $line->account->id, 'code' => $line->account->code, 'name' => $line->account->name]
                        : null,
                ])->values()->all(),
            ],
            'journal' => $journal ? [
                'id' => $journal->id,
                'number' => $journal->number,
                'status' => $journal->status,
                'entry_date' => $journal->entry_date?->toDateString(),
                'lines' => $journal->lines->map(fn ($line): array => [
                    'id' => $line->id,
                    'account_code' => $line->account?->code,
                    'account_name' => $line->account?->name,
                    'debit' => (float) $line->debit,
                    'credit' => (float) $line->credit,
                    'memo' => $line->memo,
                ])->values()->all(),
            ] : null,
            'can' => [
                'post' => ($user?->hasPermissionFor('expenses', 'post') ?? false) || ($user?->isAdmin() ?? false),
                'delete' => ($user?->hasPermissionFor('expenses', 'delete') ?? false) || ($user?->isAdmin() ?? false),
            ],
        ]);
    }

    public function post(Request $request, ExpenseClaim $claim, ExpenseService $service): RedirectResponse
    {
        $service->post($claim, $request->user()?->id);

        return back()->with('success', "Voucher pengeluaran {$claim->code} berhasil diposting ke Jurnal Umum & Buku Bank.");
    }

    public function void(ExpenseClaim $claim, ExpenseService $service): RedirectResponse
    {
        $service->void($claim);

        return back()->with('success', "Voucher pengeluaran {$claim->code} telah dibatalkan (void) dan jurnalnya dibalik.");
    }
}
