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
use Modules\Driver\Models\Driver;
use Modules\Expenses\Http\Requests\SettleCashAdvanceRequest;
use Modules\Expenses\Http\Requests\StoreCashAdvanceRequest;
use Modules\Expenses\Models\CashAdvance;
use Modules\Expenses\Models\ExpenseCategory;
use Modules\Expenses\Models\ExpenseClaim;
use Modules\Expenses\Models\ExpenseClaimLine;
use Modules\Expenses\Support\CashAdvanceService;
use Modules\Expenses\Support\ExpenseSchemaInitializer;
use Modules\Fleet\Models\Vehicle;
use Modules\Partners\Models\Partner;

class CashAdvanceController extends Controller
{
    public function getRoutePrefix(): string
    {
        return 'module';
    }

    public function index(Request $request): Response
    {
        ExpenseSchemaInitializer::ensureReady();

        $status = (string) $request->string('status', '');
        $search = trim((string) $request->string('search', ''));

        $advances = CashAdvance::query()
            ->with(['companyBankAccount:id,name,kind', 'partner:id,name'])
            ->when($status !== '', fn ($q) => $q->where('status', $status))
            ->when($search !== '', function ($q) use ($search): void {
                $q->where(function ($sub) use ($search): void {
                    $sub->where('code', 'like', "%{$search}%")
                        ->orWhere('purpose', 'like', "%{$search}%")
                        ->orWhere('recipient_name', 'like', "%{$search}%");
                });
            })
            ->latest('advance_date')
            ->latest('id')
            ->paginate(20)
            ->withQueryString()
            ->through(fn (CashAdvance $adv): array => [
                'id' => $adv->id,
                'code' => $adv->code,
                'advance_date' => $adv->advance_date?->toDateString(),
                'purpose' => $adv->purpose,
                'recipient_name' => $adv->recipient_name,
                'payment_method' => $adv->payment_method,
                'amount' => (float) $adv->amount,
                'spent_amount' => (float) $adv->spent_amount,
                'returned_amount' => (float) $adv->returned_amount,
                'reimbursed_amount' => (float) $adv->reimbursed_amount,
                'outstanding_balance' => $adv->outstandingBalance(),
                'status' => $adv->status,
                'bank_account' => $adv->companyBankAccount
                    ? ['id' => $adv->companyBankAccount->id, 'name' => $adv->companyBankAccount->name, 'kind' => $adv->companyBankAccount->kind]
                    : null,
            ]);

        $user = $request->user();

        return Inertia::render('Modules/Expenses/Advances/Index', [
            'advances' => $advances,
            'statuses' => CashAdvance::STATUSES,
            'filters' => [
                'status' => $status ?: null,
                'search' => $search ?: null,
            ],
            'can' => [
                'create' => ($user?->hasPermissionFor('expenses', 'create') ?? false) || ($user?->isAdmin() ?? false),
                'disburse' => ($user?->hasPermissionFor('expenses', 'disburse') ?? false) || ($user?->isAdmin() ?? false),
                'settle' => ($user?->hasPermissionFor('expenses', 'settle') ?? false) || ($user?->isAdmin() ?? false),
            ],
        ]);
    }

    public function create(): Response
    {
        ExpenseSchemaInitializer::ensureReady();

        return Inertia::render('Modules/Expenses/Advances/Create', [
            'suggestedCode' => CashAdvance::nextCode(),
            'paymentMethods' => PaymentMethodAccountMap::METHODS,
            'bankAccounts' => CompanyBankAccount::query()
                ->where('is_active', true)
                ->orderBy('kind')
                ->orderBy('name')
                ->get(['id', 'name', 'kind']),
            'drivers' => Schema::hasTable('drivers')
                ? Driver::query()->orderBy('name')->limit(100)->get(['id', 'name'])
                : [],
            'partners' => Schema::hasTable('partners')
                ? Partner::query()->orderBy('name')->limit(100)->get(['id', 'name'])
                : [],
            'vehicles' => Schema::hasTable('vehicles')
                ? Vehicle::query()->orderBy('plate_number')->limit(100)->get(['id', 'name', 'plate_number'])
                : [],
        ]);
    }

    public function store(StoreCashAdvanceRequest $request, CashAdvanceService $service): RedirectResponse
    {
        $advance = $service->create($request->validated(), $request->user()?->id);

        return redirect()
            ->route($this->getRoutePrefix().'.expenses.advances.show', $advance)
            ->with('success', "Kasbon / Uang Jalan {$advance->code} berhasil disimpan.");
    }

    public function show(Request $request, CashAdvance $advance): Response
    {
        ExpenseSchemaInitializer::ensureReady();

        $advance->load([
            'companyBankAccount:id,name,kind',
            'advanceAccount:id,code,name',
            'expenseClaims.lines.category:id,code,name',
            'expenseClaims.lines.account:id,code,name',
        ]);

        $journals = JournalEntry::query()
            ->where('source_type', $advance->getMorphClass())
            ->where('source_id', $advance->id)
            ->with('lines.account:id,code,name')
            ->orderBy('id')
            ->get()
            ->map(fn (JournalEntry $j): array => [
                'id' => $j->id,
                'number' => $j->number,
                'event' => $j->event,
                'status' => $j->status,
                'entry_date' => $j->entry_date?->toDateString(),
                'lines' => $j->lines->map(fn ($l): array => [
                    'id' => $l->id,
                    'account_code' => $l->account?->code,
                    'account_name' => $l->account?->name,
                    'debit' => (float) $l->debit,
                    'credit' => (float) $l->credit,
                    'memo' => $l->memo,
                ])->values()->all(),
            ])->values()->all();

        $user = $request->user();

        return Inertia::render('Modules/Expenses/Advances/Show', [
            'advance' => [
                'id' => $advance->id,
                'code' => $advance->code,
                'advance_date' => $advance->advance_date?->toDateString(),
                'purpose' => $advance->purpose,
                'recipient_name' => $advance->recipient_name,
                'payment_method' => $advance->payment_method,
                'amount' => (float) $advance->amount,
                'spent_amount' => (float) $advance->spent_amount,
                'returned_amount' => (float) $advance->returned_amount,
                'reimbursed_amount' => (float) $advance->reimbursed_amount,
                'outstanding_balance' => $advance->outstandingBalance(),
                'status' => $advance->status,
                'reference_number' => $advance->reference_number,
                'notes' => $advance->notes,
                'disbursed_at' => $advance->disbursed_at?->toDateTimeString(),
                'settled_at' => $advance->settled_at?->toDateTimeString(),
                'bank_account' => $advance->companyBankAccount
                    ? ['id' => $advance->companyBankAccount->id, 'name' => $advance->companyBankAccount->name, 'kind' => $advance->companyBankAccount->kind]
                    : null,
                'advance_account' => $advance->advanceAccount
                    ? ['id' => $advance->advanceAccount->id, 'code' => $advance->advanceAccount->code, 'name' => $advance->advanceAccount->name]
                    : null,
                'settlement_claims' => $advance->expenseClaims->map(fn (ExpenseClaim $claim): array => [
                    'id' => $claim->id,
                    'code' => $claim->code,
                    'expense_date' => $claim->expense_date?->toDateString(),
                    'total_amount' => (float) $claim->total_amount,
                    'lines' => $claim->lines->map(fn (ExpenseClaimLine $l): array => [
                        'id' => $l->id,
                        'description' => $l->description,
                        'amount' => (float) $l->amount,
                        'receipt_number' => $l->receipt_number,
                        'category_name' => $l->category?->name,
                        'account_code' => $l->account?->code,
                        'account_name' => $l->account?->name,
                    ])->values()->all(),
                ])->values()->all(),
            ],
            'journals' => $journals,
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
            'can' => [
                'disburse' => ($user?->hasPermissionFor('expenses', 'disburse') ?? false) || ($user?->isAdmin() ?? false),
                'settle' => ($user?->hasPermissionFor('expenses', 'settle') ?? false) || ($user?->isAdmin() ?? false),
                'delete' => ($user?->hasPermissionFor('expenses', 'delete') ?? false) || ($user?->isAdmin() ?? false),
            ],
        ]);
    }

    public function disburse(Request $request, CashAdvance $advance, CashAdvanceService $service): RedirectResponse
    {
        $service->disburse($advance, $request->user()?->id);

        return back()->with('success', "Kasbon {$advance->code} berhasil dicairkan dan dicatat ke Jurnal Umum & Buku Bank.");
    }

    public function settle(SettleCashAdvanceRequest $request, CashAdvance $advance, CashAdvanceService $service): RedirectResponse
    {
        $service->settle($advance, $request->validated(), $request->user()?->id);

        return back()->with('success', "Pertanggungjawaban (LPJ) Kasbon {$advance->code} berhasil diselesaikan.");
    }

    public function void(CashAdvance $advance, CashAdvanceService $service): RedirectResponse
    {
        $service->void($advance);

        return back()->with('success', "Kasbon {$advance->code} telah dibatalkan (void).");
    }
}
