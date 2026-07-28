<?php

namespace Modules\Accounting\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Response;
use Modules\Accounting\Models\FiscalPeriod;
use Modules\Accounting\Models\FiscalYear;
use Modules\Accounting\Support\FiscalCalendarService;

class FiscalPeriodController extends Controller
{
    public function getRoutePrefix(): string
    {
        return 'module';
    }

    public function index(FiscalCalendarService $calendar): Response
    {
        $year = (int) request()->integer('year', (int) now()->format('Y'));
        $calendar->ensureYear($year);

        $years = FiscalYear::query()->orderByDesc('year')->get(['id', 'year', 'is_closed']);
        $fiscalYear = FiscalYear::query()->where('year', $year)->with('periods')->firstOrFail();

        return inertia('Modules/Accounting/Periods/Index', [
            'year' => $year,
            'years' => $years,
            'periods' => $fiscalYear->periods->map(fn (FiscalPeriod $period): array => [
                'id' => $period->id,
                'period_index' => $period->period_index,
                'name' => $period->name,
                'starts_on' => $period->starts_on->toDateString(),
                'ends_on' => $period->ends_on->toDateString(),
                'status' => $period->status,
            ]),
            'can' => [
                'period' => auth()->user()?->hasPermissionFor('accounting', 'period') ?? false,
            ],
        ]);
    }

    public function softClose(FiscalPeriod $period, FiscalCalendarService $calendar): RedirectResponse
    {
        try {
            $calendar->softClose($period);
        } catch (ValidationException $e) {
            throw $e;
        }

        return back()->with('success', __('accounting.messages.period_soft_closed'));
    }

    public function hardClose(FiscalPeriod $period, FiscalCalendarService $calendar): RedirectResponse
    {
        $calendar->hardClose($period);

        return back()->with('success', __('accounting.messages.period_hard_closed'));
    }

    public function reopen(FiscalPeriod $period, FiscalCalendarService $calendar): RedirectResponse
    {
        $calendar->reopen($period);

        return back()->with('success', __('accounting.messages.period_reopened'));
    }

    public function ensureYear(Request $request, FiscalCalendarService $calendar): RedirectResponse
    {
        $validated = $request->validate([
            'year' => ['required', 'integer', 'min:2000', 'max:2100'],
        ]);

        $calendar->ensureYear((int) $validated['year']);

        return redirect()
            ->route($this->getRoutePrefix().'.accounting.periods.index', ['year' => $validated['year']])
            ->with('success', __('accounting.messages.year_ensured'));
    }
}
