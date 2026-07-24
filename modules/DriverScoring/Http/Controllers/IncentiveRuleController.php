<?php

namespace Modules\DriverScoring\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Modules\DriverScoring\Http\Requests\StoreIncentiveRuleRequest;
use Modules\DriverScoring\Http\Requests\UpdateIncentiveRuleRequest;
use Modules\DriverScoring\Models\DriverIncentiveAward;
use Modules\DriverScoring\Models\DriverIncentiveRule;
use Modules\DriverScoring\Support\IncentiveEvaluator;

class IncentiveRuleController extends Controller
{
    public function index(Request $request): Response
    {
        return Inertia::render('Modules/DriverScoring/Incentives/Index', [
            'rules' => DriverIncentiveRule::query()->latest('id')->get(),
            'awards' => DriverIncentiveAward::query()
                ->with(['driver:id,name', 'rule:id,name'])
                ->latest('id')
                ->limit(50)
                ->get(),
            'can' => [
                'create' => $request->user()?->hasPermissionFor('scoring', 'create') ?? false,
                'update' => $request->user()?->hasPermissionFor('scoring', 'update') ?? false,
                'delete' => $request->user()?->hasPermissionFor('scoring', 'delete') ?? false,
                'award' => $request->user()?->hasPermissionFor('scoring', 'award') ?? false,
            ],
        ]);
    }

    public function store(StoreIncentiveRuleRequest $request): RedirectResponse
    {
        DriverIncentiveRule::query()->create($request->validated());

        return back()->with('success', 'Incentive rule created.');
    }

    public function update(UpdateIncentiveRuleRequest $request, DriverIncentiveRule $rule): RedirectResponse
    {
        $rule->update($request->validated());

        return back()->with('success', 'Incentive rule updated.');
    }

    public function destroy(DriverIncentiveRule $rule): RedirectResponse
    {
        $rule->delete();

        return back()->with('success', 'Incentive rule deleted.');
    }

    public function evaluate(IncentiveEvaluator $evaluator): RedirectResponse
    {
        $awards = $evaluator->evaluate();

        return back()->with('success', count($awards).' new incentive award(s) created.');
    }
}
