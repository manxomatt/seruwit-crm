<?php

namespace App\Http\Controllers\Module;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreResellerCommissionRuleRequest;
use App\Http\Requests\UpdateResellerCommissionRuleRequest;
use App\Models\ResellerCommissionRule;
use Illuminate\Http\RedirectResponse;

class ResellerCommissionRuleController extends Controller
{
    public function store(StoreResellerCommissionRuleRequest $request): RedirectResponse
    {
        ResellerCommissionRule::query()->create($request->validated());

        return back()->with('success', __('reseller.flash.rule_created'));
    }

    /**
     * A rule's scope is fixed once created: changing which reseller or plan it
     * covers would silently re-target an agreement, so those fields are
     * dropped and the admin creates a new rule instead.
     */
    public function update(UpdateResellerCommissionRuleRequest $request, ResellerCommissionRule $rule): RedirectResponse
    {
        $rule->update(collect($request->validated())
            ->except(['reseller_global_id', 'plan_id'])
            ->all());

        return back()->with('success', __('reseller.flash.rule_updated'));
    }

    /**
     * Deleting a rule never touches commissions already accrued under it —
     * the ledger keeps its own copy of the rate.
     */
    public function destroy(ResellerCommissionRule $rule): RedirectResponse
    {
        $rule->delete();

        return back()->with('success', __('reseller.flash.rule_deleted'));
    }
}
