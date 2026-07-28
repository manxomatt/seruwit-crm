<?php

namespace Modules\Accounting\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Response;
use Modules\Accounting\Http\Requests\StoreOpeningBalanceRequest;
use Modules\Accounting\Models\Account;
use Modules\Accounting\Models\FiscalYear;
use Modules\Accounting\Support\FiscalCalendarService;
use Modules\Accounting\Support\OpeningBalanceService;

class OpeningBalanceController extends Controller
{
    public function getRoutePrefix(): string
    {
        return 'module';
    }

    public function create(Request $request, FiscalCalendarService $calendar, OpeningBalanceService $openings): Response
    {
        $year = (int) $request->integer('year', (int) now()->format('Y'));
        $fiscalYear = $calendar->ensureYear($year);
        $existing = $openings->findOpening($fiscalYear);

        return inertia('Modules/Accounting/OpeningBalances/Create', [
            'year' => $fiscalYear->year,
            'years' => FiscalYear::query()->orderByDesc('year')->get(['id', 'year', 'is_closed']),
            'entry_date' => $fiscalYear->starts_on->toDateString(),
            'accounts' => Account::query()
                ->where('is_postable', true)
                ->where('is_active', true)
                ->whereIn('type', [
                    Account::TYPE_ASSET,
                    Account::TYPE_LIABILITY,
                    Account::TYPE_EQUITY,
                ])
                ->orderBy('code')
                ->get(['id', 'code', 'name', 'type', 'normal_balance']),
            'existing' => $existing
                ? [
                    'id' => $existing->id,
                    'number' => $existing->number,
                    'entry_date' => $existing->entry_date->toDateString(),
                ]
                : null,
            'has_activity' => $openings->yearHasPostedActivity($fiscalYear),
            'year_closed' => $fiscalYear->is_closed,
            'can' => [
                'period' => auth()->user()?->hasPermissionFor('accounting', 'period') ?? false,
            ],
        ]);
    }

    public function store(
        StoreOpeningBalanceRequest $request,
        FiscalCalendarService $calendar,
        OpeningBalanceService $openings,
    ): RedirectResponse {
        $year = $calendar->ensureYear((int) $request->validated('year'));

        try {
            $entry = $openings->post(
                year: $year,
                lines: $request->validated('lines'),
                entryDate: $request->validated('entry_date'),
                memo: $request->validated('memo'),
                userId: auth()->id(),
            );
        } catch (ValidationException $e) {
            throw $e;
        }

        return redirect()
            ->route($this->getRoutePrefix().'.accounting.journals.show', $entry)
            ->with('success', __('accounting.messages.opening_balance_posted'));
    }
}
