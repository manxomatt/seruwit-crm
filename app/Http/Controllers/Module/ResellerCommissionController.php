<?php

namespace App\Http\Controllers\Module;

use App\Http\Controllers\Controller;
use App\Models\ResellerCommission;
use App\Services\ResellerCommissionService;
use App\Services\ResellerEarningsService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * The platform-wide commission queue: what is accruing, what is ready to pay,
 * and the escape hatch for commissions that turned out not to be owed.
 */
class ResellerCommissionController extends Controller
{
    public function __construct(
        private readonly ResellerEarningsService $earnings,
        private readonly ResellerCommissionService $commissions,
    ) {}

    public function index(Request $request): Response
    {
        Gate::authorize('manage-resellers');

        $status = $request->input('status');

        $query = ResellerCommission::query()
            ->with(['tenant:id,name', 'plan:id,name', 'reseller:global_id,name'])
            ->latest();

        if (in_array($status, [...ResellerCommission::liveStatuses(), ResellerCommission::STATUS_VOID], true)) {
            $query->where('status', $status);
        }

        $paginated = $query->paginate(20)->withQueryString();

        $totals = ResellerCommission::query()
            ->selectRaw('status, COALESCE(SUM(commission_amount), 0) AS total, COUNT(*) AS rows')
            ->groupBy('status')
            ->get()
            ->keyBy('status');

        return Inertia::render('Module/Resellers/Commissions', [
            'commissions' => $paginated->through(fn (ResellerCommission $c): array => array_merge(
                $this->earnings->presentCommission($c),
                [
                    'reseller_name' => $c->reseller?->name,
                    'reseller_global_id' => $c->reseller_global_id,
                ],
            )),
            'totals' => collect([
                ResellerCommission::STATUS_PENDING,
                ResellerCommission::STATUS_APPROVED,
                ResellerCommission::STATUS_PAID,
                ResellerCommission::STATUS_VOID,
            ])->mapWithKeys(fn (string $key): array => [$key => [
                'total' => (float) ($totals[$key]->total ?? 0),
                'count' => (int) ($totals[$key]->rows ?? 0),
            ]])->all(),
            'filters' => ['status' => $status ?: null],
        ]);
    }

    public function export(Request $request): StreamedResponse
    {
        Gate::authorize('manage-resellers');

        $query = ResellerCommission::query();
        $status = $request->input('status');

        if (in_array($status, [...ResellerCommission::liveStatuses(), ResellerCommission::STATUS_VOID], true)) {
            $query->where('status', $status);
        }

        return $this->earnings->csvResponse($query, 'komisi-reseller-'.now()->format('Y-m-d').'.csv');
    }

    public function void(Request $request, ResellerCommission $commission): RedirectResponse
    {
        Gate::authorize('manage-resellers');

        $validated = $request->validate([
            'reason' => ['required', 'string', 'max:500'],
        ]);

        if (! $this->commissions->void($commission, $validated['reason'])) {
            return back()->with('error', __('reseller.flash.void_refused'));
        }

        return back()->with('success', __('reseller.flash.voided'));
    }
}
