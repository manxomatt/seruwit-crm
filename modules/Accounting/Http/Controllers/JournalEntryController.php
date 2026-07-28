<?php

namespace Modules\Accounting\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Response;
use Modules\Accounting\Http\Requests\StoreJournalEntryRequest;
use Modules\Accounting\Http\Requests\UpdateJournalEntryRequest;
use Modules\Accounting\Models\Account;
use Modules\Accounting\Models\FiscalPeriod;
use Modules\Accounting\Models\JournalEntry;
use Modules\Accounting\Support\JournalService;

class JournalEntryController extends Controller
{
    public function getRoutePrefix(): string
    {
        return 'module';
    }

    public function index(Request $request): Response
    {
        $journals = JournalEntry::query()
            ->with('fiscalPeriod:id,name')
            ->when($request->string('status')->toString(), fn ($q, $status) => $q->where('status', $status))
            ->when($request->integer('period_id'), fn ($q, $periodId) => $q->where('fiscal_period_id', $periodId))
            ->latest('entry_date')
            ->latest('id')
            ->paginate(20)
            ->withQueryString()
            ->through(fn (JournalEntry $entry): array => [
                'id' => $entry->id,
                'number' => $entry->number,
                'entry_date' => $entry->entry_date->toDateString(),
                'type' => $entry->type,
                'status' => $entry->status,
                'memo' => $entry->memo,
                'period' => $entry->fiscalPeriod?->only(['id', 'name']),
            ]);

        return inertia('Modules/Accounting/Journals/Index', [
            'journals' => $journals,
            'filters' => [
                'status' => $request->string('status')->toString() ?: null,
                'period_id' => $request->integer('period_id') ?: null,
            ],
            'periods' => FiscalPeriod::query()->orderByDesc('starts_on')->limit(24)->get(['id', 'name']),
            'can' => [
                'journal' => auth()->user()?->hasPermissionFor('accounting', 'journal') ?? false,
                'post' => auth()->user()?->hasPermissionFor('accounting', 'post') ?? false,
            ],
        ]);
    }

    public function create(): Response
    {
        return inertia('Modules/Accounting/Journals/Create', [
            'accounts' => $this->postableAccounts(),
            'defaults' => [
                'entry_date' => now()->toDateString(),
            ],
        ]);
    }

    public function store(StoreJournalEntryRequest $request, JournalService $journals): RedirectResponse
    {
        try {
            $entry = $journals->createDraft($request->validated(), auth()->id());
        } catch (ValidationException $e) {
            throw $e;
        }

        return redirect()
            ->route($this->getRoutePrefix().'.accounting.journals.show', $entry)
            ->with('success', __('accounting.messages.journal_created'));
    }

    public function show(JournalEntry $journal): Response
    {
        $journal->load(['lines.account:id,code,name', 'fiscalPeriod:id,name,status', 'postedByUser:id,name', 'createdByUser:id,name']);

        return inertia('Modules/Accounting/Journals/Show', [
            'journal' => [
                'id' => $journal->id,
                'number' => $journal->number,
                'entry_date' => $journal->entry_date->toDateString(),
                'type' => $journal->type,
                'status' => $journal->status,
                'memo' => $journal->memo,
                'posted_at' => $journal->posted_at?->toIso8601String(),
                'period' => $journal->fiscalPeriod?->only(['id', 'name', 'status']),
                'created_by' => $journal->createdByUser?->only(['id', 'name']),
                'posted_by' => $journal->postedByUser?->only(['id', 'name']),
                'total_debit' => $journal->totalDebit(),
                'total_credit' => $journal->totalCredit(),
                'lines' => $journal->lines->map(fn ($line): array => [
                    'id' => $line->id,
                    'account' => $line->account?->only(['id', 'code', 'name']),
                    'debit' => (float) $line->debit,
                    'credit' => (float) $line->credit,
                    'memo' => $line->memo,
                ]),
            ],
            'can' => [
                'journal' => auth()->user()?->hasPermissionFor('accounting', 'journal') ?? false,
                'post' => auth()->user()?->hasPermissionFor('accounting', 'post') ?? false,
            ],
        ]);
    }

    public function edit(JournalEntry $journal): Response
    {
        if (! $journal->isDraft()) {
            abort(403);
        }

        $journal->load('lines');

        return inertia('Modules/Accounting/Journals/Edit', [
            'journal' => [
                'id' => $journal->id,
                'number' => $journal->number,
                'entry_date' => $journal->entry_date->toDateString(),
                'memo' => $journal->memo,
                'lines' => $journal->lines->map(fn ($line): array => [
                    'account_id' => $line->account_id,
                    'debit' => (float) $line->debit,
                    'credit' => (float) $line->credit,
                    'memo' => $line->memo,
                ]),
            ],
            'accounts' => $this->postableAccounts(),
        ]);
    }

    public function update(UpdateJournalEntryRequest $request, JournalEntry $journal, JournalService $journals): RedirectResponse
    {
        try {
            $journals->updateDraft($journal, $request->validated());
        } catch (ValidationException $e) {
            throw $e;
        }

        return redirect()
            ->route($this->getRoutePrefix().'.accounting.journals.show', $journal)
            ->with('success', __('accounting.messages.journal_updated'));
    }

    public function destroy(JournalEntry $journal, JournalService $journals): RedirectResponse
    {
        try {
            $journals->deleteDraft($journal);
        } catch (ValidationException $e) {
            throw $e;
        }

        return redirect()
            ->route($this->getRoutePrefix().'.accounting.journals.index')
            ->with('success', __('accounting.messages.journal_deleted'));
    }

    public function post(JournalEntry $journal, JournalService $journals): RedirectResponse
    {
        try {
            $journals->post($journal, auth()->id());
        } catch (ValidationException $e) {
            throw $e;
        }

        return redirect()
            ->route($this->getRoutePrefix().'.accounting.journals.show', $journal)
            ->with('success', __('accounting.messages.journal_posted'));
    }

    /**
     * @return list<array{id: int, code: string, name: string}>
     */
    private function postableAccounts(): array
    {
        return Account::query()
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
