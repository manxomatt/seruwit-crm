<?php

namespace App\Http\Controllers\Module;

use App\Http\Controllers\Controller;
use App\Models\ResellerCommission;
use App\Models\ResellerPayout;
use App\Models\ResellerProfile;
use App\Services\ResellerEarningsService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

/**
 * A reseller's own view of the programme.
 *
 * Every query here is scoped to the authenticated user's global id and never
 * to anything the request supplies — there is no id parameter to tamper with,
 * which is the whole point.
 */
class ResellerPortalController extends Controller
{
    public function __construct(private readonly ResellerEarningsService $earnings) {}

    public function dashboard(Request $request): Response
    {
        Gate::authorize('view-reseller-earnings');

        $globalId = (string) $request->user()->global_id;
        $profile = ResellerProfile::ensureFor($globalId);

        $recent = $this->earnings->ledgerQuery($globalId)
            ->with(['tenant:id,name', 'plan:id,name'])
            ->latest()
            ->limit(5)
            ->get()
            ->map(fn (ResellerCommission $c) => $this->earnings->presentCommission($c))
            ->all();

        return Inertia::render('Module/Reseller/Dashboard', [
            'summary' => $this->earnings->summary($globalId),
            'series' => $this->earnings->monthlySeries($globalId),
            'recent' => $recent,
            'referral' => [
                'code' => $profile->referral_code,
                'url' => $profile->referralUrl(),
            ],
            'profile' => [
                'status' => $profile->status,
                'bank_name' => $profile->payout_bank_name,
                'account_number' => $profile->payout_account_number,
                'account_name' => $profile->payout_account_name,
                'minimum_payout' => (float) $profile->minimum_payout,
            ],
        ]);
    }

    /**
     * A reseller's own payout history. Same scoping rule as everything else in
     * this controller: the signed-in identity, never a parameter.
     */
    public function payouts(Request $request): Response
    {
        Gate::authorize('view-reseller-earnings');

        $globalId = (string) $request->user()->global_id;

        $payouts = ResellerPayout::query()
            ->where('reseller_global_id', $globalId)
            ->latest()
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('Module/Reseller/Payouts', [
            'payouts' => $payouts->through(fn (ResellerPayout $payout) => $this->earnings->presentPayout($payout)),
            'summary' => $this->earnings->summary($globalId),
        ]);
    }

    public function commissions(Request $request): Response
    {
        Gate::authorize('view-reseller-earnings');

        $globalId = (string) $request->user()->global_id;
        $status = $request->input('status');
        $search = $request->string('search')->trim()->value();

        $query = $this->earnings->ledgerQuery($globalId)
            ->with(['tenant:id,name', 'plan:id,name'])
            ->latest();

        if (in_array($status, ResellerCommission::liveStatuses(), true) || $status === ResellerCommission::STATUS_VOID) {
            $query->where('status', $status);
        }

        if ($search !== '') {
            $query->whereHas('tenant', fn ($q) => $q->where('name', 'ilike', "%{$search}%"));
        }

        $paginated = $query->paginate(20)->withQueryString();

        return Inertia::render('Module/Reseller/Commissions', [
            'commissions' => $paginated->through(fn (ResellerCommission $c) => $this->earnings->presentCommission($c)),
            'summary' => $this->earnings->summary($globalId),
            'filters' => [
                'status' => $status ?: null,
                'search' => $search ?: null,
            ],
        ]);
    }
}
