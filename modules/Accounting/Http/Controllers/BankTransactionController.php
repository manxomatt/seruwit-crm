<?php

namespace Modules\Accounting\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Response;
use Modules\Accounting\Http\Requests\ClearBankTransactionsRequest;
use Modules\Accounting\Http\Requests\StoreBankTransactionRequest;
use Modules\Accounting\Models\BankTransaction;
use Modules\Accounting\Models\CompanyBankAccount;
use Modules\Accounting\Support\BankBookService;

class BankTransactionController extends Controller
{
    protected function getRoutePrefix(): string
    {
        return 'module';
    }

    public function index(Request $request): Response
    {
        $accountId = $request->integer('company_bank_account_id') ?: null;
        $cleared = $request->string('cleared')->toString();

        $transactions = BankTransaction::query()
            ->with([
                'companyBankAccount:id,name,kind',
                'counterpartyAccount:id,name,kind',
            ])
            ->where('status', BankTransaction::STATUS_POSTED)
            ->when($accountId, fn ($q) => $q->where('company_bank_account_id', $accountId))
            ->when($cleared === '1', fn ($q) => $q->where('is_cleared', true))
            ->when($cleared === '0', fn ($q) => $q->where('is_cleared', false))
            ->when($request->filled('from'), fn ($q) => $q->whereDate('transacted_on', '>=', $request->string('from')))
            ->when($request->filled('to'), fn ($q) => $q->whereDate('transacted_on', '<=', $request->string('to')))
            ->latest('transacted_on')
            ->latest('id')
            ->paginate(25)
            ->withQueryString()
            ->through(fn (BankTransaction $txn): array => [
                'id' => $txn->id,
                'type' => $txn->type,
                'direction' => $txn->direction,
                'transacted_on' => $txn->transacted_on?->toDateString(),
                'amount' => (float) $txn->amount,
                'reference' => $txn->reference,
                'memo' => $txn->memo,
                'is_cleared' => $txn->is_cleared,
                'cleared_on' => $txn->cleared_on?->toDateString(),
                'account' => $txn->companyBankAccount
                    ? [
                        'id' => $txn->companyBankAccount->id,
                        'name' => $txn->companyBankAccount->name,
                        'kind' => $txn->companyBankAccount->kind,
                    ]
                    : null,
                'counterparty' => $txn->counterpartyAccount
                    ? [
                        'id' => $txn->counterpartyAccount->id,
                        'name' => $txn->counterpartyAccount->name,
                        'kind' => $txn->counterpartyAccount->kind,
                    ]
                    : null,
            ]);

        $accounts = CompanyBankAccount::query()
            ->where('is_active', true)
            ->orderBy('kind')
            ->orderBy('name')
            ->get(['id', 'name', 'kind']);

        $user = $request->user();

        return inertia('Modules/Accounting/BankTransactions/Index', [
            'transactions' => $transactions,
            'accounts' => $accounts,
            'types' => BankTransaction::TYPES,
            'filters' => [
                'company_bank_account_id' => $accountId,
                'cleared' => $cleared !== '' ? $cleared : null,
                'from' => $request->string('from')->toString() ?: null,
                'to' => $request->string('to')->toString() ?: null,
            ],
            'can' => [
                'bank' => $user?->hasPermissionFor('accounting', 'bank') ?? false,
            ],
        ]);
    }

    public function create(): Response
    {
        $accounts = CompanyBankAccount::query()
            ->where('is_active', true)
            ->orderBy('kind')
            ->orderBy('name')
            ->get(['id', 'name', 'kind']);

        return inertia('Modules/Accounting/BankTransactions/Create', [
            'accounts' => $accounts,
            'types' => [
                BankTransaction::TYPE_DEPOSIT,
                BankTransaction::TYPE_WITHDRAWAL,
                BankTransaction::TYPE_TRANSFER,
                BankTransaction::TYPE_FEE,
            ],
        ]);
    }

    public function store(StoreBankTransactionRequest $request, BankBookService $book): RedirectResponse
    {
        $book->recordManual($request->validated());

        return redirect()
            ->route($this->getRoutePrefix().'.accounting.bank-transactions.index')
            ->with('success', __('accounting.messages.bank_transaction_created'));
    }

    public function clear(ClearBankTransactionsRequest $request, BankBookService $book): RedirectResponse
    {
        $ids = array_map('intval', $request->validated('ids'));
        $book->markCleared($ids, $request->validated('cleared_on'));

        return back()->with('success', __('accounting.messages.bank_transactions_cleared'));
    }

    public function unclear(ClearBankTransactionsRequest $request, BankBookService $book): RedirectResponse
    {
        $ids = array_map('intval', $request->validated('ids'));
        $book->markUncleared($ids);

        return back()->with('success', __('accounting.messages.bank_transactions_uncleared'));
    }
}
