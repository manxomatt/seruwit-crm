<?php

namespace Modules\Canvassing\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Canvassing\Models\CanvassingPlan;
use Modules\Canvassing\Models\Salesperson;

class CanvassingPlanController extends Controller
{
    protected function getRoutePrefix(): string
    {
        return 'module';
    }

    public function index(): Response
    {
        $plans = CanvassingPlan::query()
            ->with('salesperson')
            ->when(request('salesperson_id'), fn ($q) => $q->where('salesperson_id', request('salesperson_id')))
            ->when(request('date'), fn ($q) => $q->where('plan_date', request('date')))
            ->when(request('status'), fn ($q) => $q->where('status', request('status')))
            ->orderByDesc('plan_date')
            ->paginate(20)
            ->withQueryString();

        $salespeople = Salesperson::query()->active()->orderBy('name')->get(['id', 'name']);

        return Inertia::render('Modules/Canvassing/Plans/Index', [
            'plans' => $plans,
            'salespeople' => $salespeople,
            'filters' => request()->only(['salesperson_id', 'date', 'status']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'salesperson_id' => ['required', 'integer', 'exists:salespeople,id'],
            'plan_date' => ['required', 'date'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ]);

        CanvassingPlan::query()->create($data);

        return redirect()->route('module.canvassing.plans.index')
            ->with('success', 'Plan created.');
    }

    public function update(Request $request, CanvassingPlan $plan): RedirectResponse
    {
        $data = $request->validate([
            'status' => ['required', 'in:planned,completed,cancelled'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ]);

        $plan->update($data);

        return redirect()->back()->with('success', 'Plan updated.');
    }

    public function destroy(CanvassingPlan $plan): RedirectResponse
    {
        $plan->delete();

        return redirect()->route('module.canvassing.plans.index')
            ->with('success', 'Plan removed.');
    }
}
