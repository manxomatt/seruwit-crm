<?php

namespace App\Http\Controllers\Module;

use App\Http\Controllers\Controller;
use App\Http\Requests\MarkResellerPayoutPaidRequest;
use App\Http\Requests\StoreResellerPayoutRequest;
use App\Models\ResellerCommission;
use App\Models\ResellerPayout;
use App\Models\User;
use App\Services\ResellerEarningsService;
use App\Services\ResellerPayoutService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;
use RuntimeException;

/**
 * Platform staff's payout desk: who is owed money, and the batches that pay it.
 */
class ResellerPayoutController extends Controller
{
    public function __construct(
        private readonly ResellerPayoutService $payouts,
        private readonly ResellerEarningsService $earnings,
    ) {}

    public function index(Request $request): Response
    {
        Gate::authorize('manage-resellers');

        $status = $request->input('status');

        $query = ResellerPayout::query()
            ->with('reseller:global_id,name')
            ->latest();

        if (in_array($status, [
            ResellerPayout::STATUS_DRAFT,
            ResellerPayout::STATUS_APPROVED,
            ResellerPayout::STATUS_PAID,
            ResellerPayout::STATUS_CANCELLED,
        ], true)) {
            $query->where('status', $status);
        }

        return Inertia::render('Module/Resellers/Payouts', [
            'payouts' => $query->paginate(20)->withQueryString()->through(
                fn (ResellerPayout $payout): array => $this->earnings->presentPayout($payout),
            ),
            'candidates' => $this->payableResellers(),
            'filters' => ['status' => $status ?: null],
        ]);
    }

    /**
     * Resellers holding approved commissions that no batch has claimed yet.
     *
     * This is the queue the desk actually works from — without it an admin has
     * to guess which reseller is worth building a batch for.
     *
     * @return list<array<string, mixed>>
     */
    private function payableResellers(): array
    {
        $totals = ResellerCommission::query()
            ->where('status', ResellerCommission::STATUS_APPROVED)
            ->whereNull('payout_id')
            ->selectRaw('reseller_global_id, COALESCE(SUM(net_amount), 0) AS total, COUNT(*) AS entries, MIN(created_at) AS earliest')
            ->groupBy('reseller_global_id')
            ->get();

        $names = User::query()
            ->whereIn('global_id', $totals->pluck('reseller_global_id'))
            ->pluck('name', 'global_id');

        return $totals->map(fn ($row): array => [
            'reseller_global_id' => $row->reseller_global_id,
            'reseller_name' => $names[$row->reseller_global_id] ?? null,
            'total' => (float) $row->total,
            'entries' => (int) $row->entries,
            'earliest' => $row->earliest ? Carbon::parse($row->earliest)->toDateString() : null,
        ])->all();
    }

    public function store(StoreResellerPayoutRequest $request): RedirectResponse
    {
        try {
            $payout = $this->payouts->buildDraft(
                $request->string('reseller_global_id')->value(),
                Carbon::parse($request->date('period_start')),
                Carbon::parse($request->date('period_end')),
            );
        } catch (RuntimeException $exception) {
            return back()->with('error', $exception->getMessage());
        }

        if ($payout === null) {
            return back()->with('error', __('reseller.flash.payout_nothing_to_pay'));
        }

        return redirect()
            ->route('module.reseller-payouts.show', $payout->id)
            ->with('success', __('reseller.flash.payout_created'));
    }

    public function show(ResellerPayout $payout): Response
    {
        Gate::authorize('manage-resellers');

        $payout->load('reseller:global_id,name');

        return Inertia::render('Module/Resellers/PayoutDetail', [
            'payout' => $this->earnings->presentPayout($payout),
            'commissions' => $payout->commissions()
                ->with(['tenant', 'plan:id,name'])
                ->latest()
                ->get()
                ->map(fn (ResellerCommission $c): array => $this->earnings->presentCommission($c))
                ->all(),
        ]);
    }

    public function approve(ResellerPayout $payout, Request $request): RedirectResponse
    {
        Gate::authorize('manage-resellers');

        try {
            $this->payouts->approve($payout, $request->user());
        } catch (RuntimeException $exception) {
            return back()->with('error', $exception->getMessage());
        }

        return back()->with('success', __('reseller.flash.payout_approved'));
    }

    public function pay(MarkResellerPayoutPaidRequest $request, ResellerPayout $payout): RedirectResponse
    {
        try {
            $this->payouts->markPaid(
                $payout,
                $request->user(),
                $request->file('proof'),
                $request->input('notes'),
            );
        } catch (RuntimeException $exception) {
            return back()->with('error', $exception->getMessage());
        }

        return back()->with('success', __('reseller.flash.payout_paid'));
    }

    public function cancel(ResellerPayout $payout): RedirectResponse
    {
        Gate::authorize('manage-resellers');

        try {
            $this->payouts->cancel($payout);
        } catch (RuntimeException $exception) {
            return back()->with('error', $exception->getMessage());
        }

        return back()->with('success', __('reseller.flash.payout_cancelled'));
    }
}
