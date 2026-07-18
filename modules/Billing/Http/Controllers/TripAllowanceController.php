<?php

namespace Modules\Billing\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Billing\Http\Requests\StoreAllowanceExpenseRequest;
use Modules\Billing\Http\Requests\StoreTripAllowanceRequest;
use Modules\Billing\Models\TripAllowance;
use Modules\Billing\Models\TripAllowanceExpense;
use Modules\TransportationManagement\Models\Trip;

class TripAllowanceController extends Controller
{
    /**
     * Get the route prefix for this controller.
     */
    protected function getRoutePrefix(): string
    {
        return 'module';
    }

    /**
     * Display a listing of the trip allowances.
     */
    public function index(): Response
    {
        $user = Auth::user();

        $allowances = TripAllowance::query()
            ->with(['trip:id,code,origin,destination,driver_id', 'trip.driver:id,name'])
            ->withSum('expenses', 'amount')
            ->when(request('status'), fn ($query, $status) => $query->where('status', $status))
            ->latest('issued_at')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Modules/Billing/Allowances/Index', [
            'allowances' => $allowances,
            'summary' => [
                'unsettled_count' => TripAllowance::query()->where('status', TripAllowance::STATUS_ISSUED)->count(),
                'outstanding_advance' => (float) TripAllowance::query()
                    ->where('status', TripAllowance::STATUS_ISSUED)
                    ->sum('advance_amount'),
            ],
            'filters' => [
                'status' => request('status'),
            ],
            'can' => [
                'create' => $user->hasPermissionFor('billing', 'create'),
                'update' => $user->hasPermissionFor('billing', 'update'),
                'delete' => $user->hasPermissionFor('billing', 'delete'),
            ],
        ]);
    }

    /**
     * Show the form for creating a new allowance. Advances are normally issued
     * before departure, but completed trips are offered too so ops can
     * backfill paper records.
     */
    public function create(): Response
    {
        return Inertia::render('Modules/Billing/Allowances/Create', [
            'trips' => Trip::query()
                ->with('driver:id,name')
                ->where('status', '!=', Trip::STATUS_CANCELLED)
                ->whereNotIn('id', TripAllowance::query()->select('trip_id'))
                ->latest('scheduled_at')
                ->get(['id', 'code', 'origin', 'destination', 'driver_id', 'scheduled_at']),
        ]);
    }

    /**
     * Store a newly created allowance in storage.
     */
    public function store(StoreTripAllowanceRequest $request): RedirectResponse
    {
        $trip = Trip::findOrFail($request->validated()['trip_id']);

        if ($trip->status === Trip::STATUS_CANCELLED) {
            return back()->with('error', 'A cancelled trip cannot receive an allowance.');
        }

        $allowance = TripAllowance::create([
            ...$request->validated(),
            'status' => TripAllowance::STATUS_ISSUED,
            'issued_at' => now(),
        ]);

        return redirect()->route($this->getRoutePrefix().'.billing.allowances.show', $allowance)
            ->with('success', 'Allowance issued.');
    }

    /**
     * Display the specified allowance.
     */
    public function show(TripAllowance $allowance): Response
    {
        $user = Auth::user();

        $allowance->load(['trip:id,code,origin,destination,driver_id,status', 'trip.driver:id,name', 'expenses']);

        return Inertia::render('Modules/Billing/Allowances/Show', [
            'allowance' => $allowance,
            'balance' => $allowance->balance(),
            'categories' => TripAllowanceExpense::CATEGORIES,
            'can' => [
                'create' => $user->hasPermissionFor('billing', 'create'),
                'update' => $user->hasPermissionFor('billing', 'update'),
                'delete' => $user->hasPermissionFor('billing', 'delete'),
            ],
        ]);
    }

    /**
     * Remove the specified allowance. A settled allowance is a closed
     * financial record and stays.
     */
    public function destroy(TripAllowance $allowance): RedirectResponse
    {
        if ($allowance->status !== TripAllowance::STATUS_ISSUED) {
            return back()->with('error', 'A settled allowance cannot be deleted.');
        }

        $allowance->delete();

        return redirect()->route($this->getRoutePrefix().'.billing.allowances.index')
            ->with('success', 'Allowance deleted.');
    }

    /**
     * Record an expense against the allowance.
     */
    public function storeExpense(StoreAllowanceExpenseRequest $request, TripAllowance $allowance): RedirectResponse
    {
        if ($allowance->status !== TripAllowance::STATUS_ISSUED) {
            return back()->with('error', 'Expenses can no longer be changed after settlement.');
        }

        $allowance->expenses()->create($request->validated());

        return back()->with('success', 'Expense recorded.');
    }

    /**
     * Remove the specified expense.
     */
    public function destroyExpense(TripAllowance $allowance, TripAllowanceExpense $expense): RedirectResponse
    {
        if ($expense->trip_allowance_id !== $allowance->id) {
            abort(404);
        }

        if ($allowance->status !== TripAllowance::STATUS_ISSUED) {
            return back()->with('error', 'Expenses can no longer be changed after settlement.');
        }

        $expense->delete();

        return back()->with('success', 'Expense removed.');
    }

    /**
     * Settle the allowance. The balance is computed server-side: positive
     * means the driver returns money, negative means the company reimburses.
     * There is no unsettle — settlement is a cash-handover event.
     */
    public function settle(TripAllowance $allowance): RedirectResponse
    {
        if ($allowance->status !== TripAllowance::STATUS_ISSUED) {
            return back()->with('error', 'This allowance has already been settled.');
        }

        $allowance->update([
            'status' => TripAllowance::STATUS_SETTLED,
            'settled_at' => now(),
        ]);

        $balance = $allowance->balance();
        $formatted = number_format(abs($balance), 0, ',', '.');

        return back()->with('success', $balance >= 0
            ? "Allowance settled. Driver returns Rp {$formatted}."
            : "Allowance settled. Company reimburses Rp {$formatted}.");
    }
}
