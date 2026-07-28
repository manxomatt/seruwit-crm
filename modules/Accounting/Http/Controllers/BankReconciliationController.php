<?php

namespace Modules\Accounting\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Response;
use Modules\Accounting\Http\Requests\ImportBankStatementRequest;
use Modules\Accounting\Http\Requests\MatchBankStatementLineRequest;
use Modules\Accounting\Http\Requests\StoreBankReconciliationRequest;
use Modules\Accounting\Models\BankReconciliation;
use Modules\Accounting\Models\BankStatementLine;
use Modules\Accounting\Models\BankTransaction;
use Modules\Accounting\Models\CompanyBankAccount;
use Modules\Accounting\Support\BankReconciliationService;

class BankReconciliationController extends Controller
{
    protected function getRoutePrefix(): string
    {
        return 'module';
    }

    public function index(Request $request): Response
    {
        $accountId = $request->integer('company_bank_account_id') ?: null;

        $reconciliations = BankReconciliation::query()
            ->with('companyBankAccount:id,name,kind')
            ->withCount('lines')
            ->when($accountId, fn ($q) => $q->where('company_bank_account_id', $accountId))
            ->latest('id')
            ->paginate(20)
            ->withQueryString()
            ->through(fn (BankReconciliation $recon): array => [
                'id' => $recon->id,
                'status' => $recon->status,
                'period_start' => $recon->period_start?->toDateString(),
                'period_end' => $recon->period_end?->toDateString(),
                'statement_date' => $recon->statement_date?->toDateString(),
                'opening_balance' => (float) $recon->opening_balance,
                'closing_balance' => (float) $recon->closing_balance,
                'lines_count' => $recon->lines_count,
                'csv_filename' => $recon->csv_filename,
                'completed_at' => $recon->completed_at?->toDateTimeString(),
                'account' => $recon->companyBankAccount
                    ? [
                        'id' => $recon->companyBankAccount->id,
                        'name' => $recon->companyBankAccount->name,
                        'kind' => $recon->companyBankAccount->kind,
                    ]
                    : null,
            ]);

        $user = $request->user();

        return inertia('Modules/Accounting/BankReconciliations/Index', [
            'reconciliations' => $reconciliations,
            'accounts' => CompanyBankAccount::query()
                ->where('is_active', true)
                ->orderBy('kind')
                ->orderBy('name')
                ->get(['id', 'name', 'kind']),
            'filters' => [
                'company_bank_account_id' => $accountId,
            ],
            'can' => [
                'bank' => $user?->hasPermissionFor('accounting', 'bank') ?? false,
            ],
        ]);
    }

    public function create(): Response
    {
        return inertia('Modules/Accounting/BankReconciliations/Create', [
            'accounts' => CompanyBankAccount::query()
                ->where('is_active', true)
                ->orderBy('kind')
                ->orderBy('name')
                ->get(['id', 'name', 'kind']),
        ]);
    }

    public function store(StoreBankReconciliationRequest $request, BankReconciliationService $service): RedirectResponse
    {
        $recon = $service->create($request->validated());

        return redirect()
            ->route($this->getRoutePrefix().'.accounting.bank-reconciliations.show', $recon)
            ->with('success', __('accounting.messages.bank_recon_created'));
    }

    public function show(BankReconciliation $bankReconciliation, BankReconciliationService $service): Response
    {
        $bankReconciliation->load(['companyBankAccount:id,name,kind', 'lines.bankTransaction:id,reference,memo,type']);

        $counts = [
            'total' => $bankReconciliation->lines->count(),
            'unmatched' => $bankReconciliation->lines->where('match_status', BankStatementLine::MATCH_UNMATCHED)->count(),
            'matched' => $bankReconciliation->lines->where('match_status', BankStatementLine::MATCH_MATCHED)->count(),
            'ignored' => $bankReconciliation->lines->where('match_status', BankStatementLine::MATCH_IGNORED)->count(),
            'adjusted' => $bankReconciliation->lines->where('match_status', BankStatementLine::MATCH_ADJUSTED)->count(),
        ];

        return inertia('Modules/Accounting/BankReconciliations/Show', [
            'reconciliation' => [
                'id' => $bankReconciliation->id,
                'status' => $bankReconciliation->status,
                'period_start' => $bankReconciliation->period_start?->toDateString(),
                'period_end' => $bankReconciliation->period_end?->toDateString(),
                'statement_date' => $bankReconciliation->statement_date?->toDateString(),
                'opening_balance' => (float) $bankReconciliation->opening_balance,
                'closing_balance' => (float) $bankReconciliation->closing_balance,
                'csv_filename' => $bankReconciliation->csv_filename,
                'notes' => $bankReconciliation->notes,
                'account' => $bankReconciliation->companyBankAccount
                    ? [
                        'id' => $bankReconciliation->companyBankAccount->id,
                        'name' => $bankReconciliation->companyBankAccount->name,
                        'kind' => $bankReconciliation->companyBankAccount->kind,
                    ]
                    : null,
            ],
            'lines' => $bankReconciliation->lines->map(fn (BankStatementLine $line): array => [
                'id' => $line->id,
                'row_number' => $line->row_number,
                'line_date' => $line->line_date?->toDateString(),
                'description' => $line->description,
                'reference' => $line->reference,
                'direction' => $line->direction,
                'amount' => (float) $line->amount,
                'match_status' => $line->match_status,
                'bank_transaction_id' => $line->bank_transaction_id,
                'journal_entry_id' => $line->journal_entry_id,
                'matched_transaction' => $line->bankTransaction
                    ? [
                        'id' => $line->bankTransaction->id,
                        'reference' => $line->bankTransaction->reference,
                        'memo' => $line->bankTransaction->memo,
                        'type' => $line->bankTransaction->type,
                    ]
                    : null,
            ])->values(),
            'bookTransactions' => $service->unmatchedBookTransactions($bankReconciliation),
            'suggestions' => $service->suggestions($bankReconciliation),
            'counts' => $counts,
            'csvHelp' => __('accounting.recon.csv_help'),
            'can' => [
                'bank' => request()->user()?->hasPermissionFor('accounting', 'bank') ?? false,
            ],
        ]);
    }

    public function import(
        ImportBankStatementRequest $request,
        BankReconciliation $bankReconciliation,
        BankReconciliationService $service,
    ): RedirectResponse {
        $count = $service->importCsv($bankReconciliation, $request->file('csv'));

        return back()->with('success', __('accounting.messages.bank_recon_imported', ['count' => $count]));
    }

    public function match(
        MatchBankStatementLineRequest $request,
        BankReconciliation $bankReconciliation,
        BankStatementLine $line,
        BankReconciliationService $service,
    ): RedirectResponse {
        $txn = BankTransaction::query()->findOrFail(
            (int) $request->validated('bank_transaction_id')
        );
        $service->match($bankReconciliation, $line, $txn);

        return back()->with('success', __('accounting.messages.bank_recon_matched'));
    }

    public function unmatch(
        BankReconciliation $bankReconciliation,
        BankStatementLine $line,
        BankReconciliationService $service,
    ): RedirectResponse {
        $service->unmatch($bankReconciliation, $line);

        return back()->with('success', __('accounting.messages.bank_recon_unmatched'));
    }

    public function ignore(
        BankReconciliation $bankReconciliation,
        BankStatementLine $line,
        BankReconciliationService $service,
    ): RedirectResponse {
        $service->ignore($bankReconciliation, $line);

        return back()->with('success', __('accounting.messages.bank_recon_ignored'));
    }

    public function unignore(
        BankReconciliation $bankReconciliation,
        BankStatementLine $line,
        BankReconciliationService $service,
    ): RedirectResponse {
        $service->unignore($bankReconciliation, $line);

        return back()->with('success', __('accounting.messages.bank_recon_unignored'));
    }

    public function adjust(
        BankReconciliation $bankReconciliation,
        BankStatementLine $line,
        BankReconciliationService $service,
    ): RedirectResponse {
        $service->adjust($bankReconciliation, $line);

        return back()->with('success', __('accounting.messages.bank_recon_adjusted'));
    }

    public function complete(
        BankReconciliation $bankReconciliation,
        BankReconciliationService $service,
    ): RedirectResponse {
        $service->complete($bankReconciliation);

        return redirect()
            ->route($this->getRoutePrefix().'.accounting.bank-reconciliations.show', $bankReconciliation)
            ->with('success', __('accounting.messages.bank_recon_completed'));
    }

    public function destroy(
        BankReconciliation $bankReconciliation,
        BankReconciliationService $service,
    ): RedirectResponse {
        $service->delete($bankReconciliation);

        return redirect()
            ->route($this->getRoutePrefix().'.accounting.bank-reconciliations.index')
            ->with('success', __('accounting.messages.bank_recon_deleted'));
    }
}
