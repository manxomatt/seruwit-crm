<?php

namespace App\Http\Controllers\Module;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateResellerProfileRequest;
use App\Models\ResellerCommission;
use App\Models\ResellerCommissionRule;
use App\Models\ResellerProfile;
use App\Models\Tenant;
use App\Models\User;
use App\Services\ResellerEarningsService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Platform staff's view of the reseller programme.
 */
class ResellerController extends Controller
{
    public function __construct(private readonly ResellerEarningsService $earnings) {}

    /**
     * Every user holding the reseller role, with what they have earned.
     *
     * Totals come from one grouped query rather than per-row lookups: the list
     * is small today, but a per-reseller summary call would be an N+1 waiting
     * for the programme to grow.
     */
    public function index(Request $request): Response
    {
        Gate::authorize('manage-resellers');

        $search = $request->string('search')->trim()->value();

        $query = User::query()
            ->whereHas('roles', fn (Builder $q) => $q->where('slug', 'reseller'))
            ->orderBy('name');

        if ($search !== '') {
            $query->where(fn (Builder $q) => $q
                ->where('name', 'ilike', "%{$search}%")
                ->orWhere('email', 'ilike', "%{$search}%"));
        }

        $resellers = $query->get();
        $globalIds = $resellers->pluck('global_id')->filter()->all();

        $profiles = ResellerProfile::query()
            ->whereIn('reseller_global_id', $globalIds)
            ->get()
            ->keyBy('reseller_global_id');

        $earned = ResellerCommission::query()
            ->whereIn('reseller_global_id', $globalIds)
            ->selectRaw('reseller_global_id, status, COALESCE(SUM(commission_amount), 0) AS total')
            ->groupBy('reseller_global_id', 'status')
            ->get()
            ->groupBy('reseller_global_id');

        $tenantCounts = Tenant::query()
            ->whereIn('reseller_global_id', $globalIds)
            ->selectRaw('reseller_global_id, COUNT(*) AS total')
            ->groupBy('reseller_global_id')
            ->pluck('total', 'reseller_global_id');

        return Inertia::render('Module/Resellers/Index', [
            'resellers' => $resellers->map(function (User $reseller) use ($profiles, $earned, $tenantCounts): array {
                $profile = $profiles->get($reseller->global_id);
                $totals = $earned->get($reseller->global_id, collect())->pluck('total', 'status');

                return [
                    'global_id' => $reseller->global_id,
                    'name' => $reseller->name,
                    'email' => $reseller->email,
                    'referral_code' => $profile?->referral_code,
                    'status' => $profile?->status ?? ResellerProfile::STATUS_ACTIVE,
                    'tenants' => (int) ($tenantCounts[$reseller->global_id] ?? 0),
                    'pending' => (float) ($totals[ResellerCommission::STATUS_PENDING] ?? 0),
                    'approved' => (float) ($totals[ResellerCommission::STATUS_APPROVED] ?? 0),
                    'paid' => (float) ($totals[ResellerCommission::STATUS_PAID] ?? 0),
                ];
            })->all(),
            'filters' => ['search' => $search ?: null],
        ]);
    }

    public function show(Request $request, string $reseller): Response
    {
        Gate::authorize('manage-resellers');

        $user = User::query()->where('global_id', $reseller)->firstOrFail();
        $profile = ResellerProfile::ensureFor($reseller);

        $commissions = $this->earnings->ledgerQuery($reseller)
            ->with(['tenant:id,name', 'plan:id,name'])
            ->latest()
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Module/Resellers/Show', [
            'reseller' => [
                'global_id' => $user->global_id,
                'name' => $user->name,
                'email' => $user->email,
            ],
            'profile' => [
                'id' => $profile->id,
                'company_name' => $profile->company_name,
                'status' => $profile->status,
                'referral_code' => $profile->referral_code,
                'referral_url' => $profile->referralUrl(),
                'default_commission_type' => $profile->default_commission_type,
                'default_commission_value' => $profile->default_commission_value !== null ? (float) $profile->default_commission_value : null,
                'renewal_commission_value' => $profile->renewal_commission_value !== null ? (float) $profile->renewal_commission_value : null,
                'payout_bank_name' => $profile->payout_bank_name,
                'payout_account_number' => $profile->payout_account_number,
                'payout_account_name' => $profile->payout_account_name,
                'tax_id' => $profile->tax_id,
                'minimum_payout' => (float) $profile->minimum_payout,
                'notes' => $profile->notes,
            ],
            // Landing copy is the reseller's own, edited from their portal —
            // admin only sees whether it is live, for support purposes.
            'landing' => [
                'is_live' => $profile->hasLandingPage(),
                'url' => $profile->landingUrl(),
            ],
            'summary' => $this->earnings->summary($reseller),
            'series' => $this->earnings->monthlySeries($reseller),
            'commissions' => $commissions->through(fn (ResellerCommission $c) => $this->earnings->presentCommission($c)),
            'rules' => ResellerCommissionRule::query()
                ->where('reseller_global_id', $reseller)
                ->with('plan:id,name')
                ->orderByDesc('priority')
                ->get()
                ->map(fn (ResellerCommissionRule $rule): array => [
                    'id' => $rule->id,
                    'plan_id' => $rule->plan_id,
                    'plan_name' => $rule->plan?->name,
                    'applies_to' => $rule->applies_to,
                    'billing_interval' => $rule->billing_interval,
                    'type' => $rule->type,
                    'value' => (float) $rule->value,
                    'max_occurrences' => $rule->max_occurrences,
                    'starts_at' => $rule->starts_at?->toDateString(),
                    'ends_at' => $rule->ends_at?->toDateString(),
                    'priority' => $rule->priority,
                    'is_active' => $rule->is_active,
                ])->all(),
            'tenants' => Tenant::query()
                ->where('reseller_global_id', $reseller)
                ->with('domains')
                ->latest()
                ->limit(20)
                ->get()
                ->map(fn (Tenant $tenant): array => [
                    'id' => $tenant->id,
                    'name' => $tenant->name,
                    'status' => $tenant->status,
                    'domain' => $tenant->domains->first()?->domain,
                    'attributed_at' => $tenant->reseller_attributed_at?->toDateString(),
                    'attribution_ends_at' => $tenant->reseller_attribution_ends_at?->toDateString(),
                ])->all(),
            'plans' => \App\Models\Plan::query()->ordered()->get(['id', 'name'])->all(),
        ]);
    }

    public function update(UpdateResellerProfileRequest $request, string $reseller): RedirectResponse
    {
        $profile = ResellerProfile::ensureFor($reseller);
        $profile->update($request->validated());

        return back()->with('success', __('reseller.flash.profile_updated'));
    }
}
