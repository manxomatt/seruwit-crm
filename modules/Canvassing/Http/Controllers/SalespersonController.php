<?php

namespace Modules\Canvassing\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Canvassing\Http\Requests\StoreSalespersonRequest;
use Modules\Canvassing\Http\Requests\UpdateSalespersonRequest;
use Modules\Canvassing\Models\CanvassingVisit;
use Modules\Canvassing\Models\Salesperson;

class SalespersonController extends Controller
{
    protected function getRoutePrefix(): string
    {
        return 'module';
    }

    public function dashboard(): Response
    {
        $today = today()->toDateString();

        $totalSalespeople = Salesperson::query()->active()->count();
        $todayVisits = CanvassingVisit::query()->today()->count();
        $openVisits = CanvassingVisit::query()->open()->count();

        $recentVisits = CanvassingVisit::query()
            ->with(['salesperson', 'partner'])
            ->latest('checked_in_at')
            ->limit(10)
            ->get();

        $activeSalespeople = Salesperson::query()
            ->active()
            ->withCount(['visits as today_visits' => fn ($q) => $q->whereDate('checked_in_at', $today)])
            ->orderByDesc('today_visits')
            ->limit(10)
            ->get();

        return Inertia::render('Modules/Canvassing/Index', [
            'stats' => [
                'total_salespeople' => $totalSalespeople,
                'today_visits' => $todayVisits,
                'open_visits' => $openVisits,
            ],
            'recentVisits' => $recentVisits,
            'activeSalespeople' => $activeSalespeople,
        ]);
    }

    public function index(): Response
    {
        $salespeople = Salesperson::query()
            ->withCount('visits')
            ->when(request('search'), fn ($q) => $q->where('name', 'like', '%'.request('search').'%')
                ->orWhere('area', 'like', '%'.request('search').'%'))
            ->when(request('active') !== null, fn ($q) => $q->where('is_active', request('active') === '1'))
            ->orderBy('name')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('Modules/Canvassing/Salespeople/Index', [
            'salespeople' => $salespeople,
            'filters' => request()->only(['search', 'active']),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Modules/Canvassing/Salespeople/Create');
    }

    public function store(StoreSalespersonRequest $request): RedirectResponse
    {
        Salesperson::query()->create($request->validated());

        return redirect()->route('module.canvassing.salespeople.index')
            ->with('success', 'Salesperson created.');
    }

    public function show(Salesperson $salesperson): Response
    {
        $salesperson->load('user');

        $visits = $salesperson->visits()
            ->with('partner')
            ->latest('checked_in_at')
            ->paginate(15);

        $targets = $salesperson->targets()
            ->orderByDesc('year')
            ->orderByDesc('month')
            ->get();

        $currentTarget = $salesperson->targets()
            ->where('year', now()->year)
            ->where('month', now()->month)
            ->first();

        $thisMonthVisits = $salesperson->visits()
            ->whereYear('checked_in_at', now()->year)
            ->whereMonth('checked_in_at', now()->month)
            ->count();

        return Inertia::render('Modules/Canvassing/Salespeople/Show', [
            'salesperson' => $salesperson,
            'visits' => $visits,
            'targets' => $targets,
            'currentTarget' => $currentTarget,
            'thisMonthVisits' => $thisMonthVisits,
        ]);
    }

    public function edit(Salesperson $salesperson): Response
    {
        return Inertia::render('Modules/Canvassing/Salespeople/Edit', [
            'salesperson' => $salesperson,
        ]);
    }

    public function update(UpdateSalespersonRequest $request, Salesperson $salesperson): RedirectResponse
    {
        $salesperson->update($request->validated());

        return redirect()->route('module.canvassing.salespeople.show', $salesperson)
            ->with('success', 'Salesperson updated.');
    }

    public function destroy(Salesperson $salesperson): RedirectResponse
    {
        $salesperson->delete();

        return redirect()->route('module.canvassing.salespeople.index')
            ->with('success', 'Salesperson removed.');
    }
}
