<?php

namespace Modules\Rental\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Fleet\Models\Driver;
use Modules\Fleet\Models\Vehicle;
use Modules\Partners\Models\Partner;
use Modules\Rental\Http\Requests\StoreRentalRequest;
use Modules\Rental\Http\Requests\UpdateRentalRequest;
use Modules\Rental\Models\Rental;
use Modules\Rental\Models\RentalRate;

class RentalController extends Controller
{
    protected function getRoutePrefix(): string
    {
        return 'module';
    }

    public function index(): Response
    {
        $rentals = Rental::query()
            ->with([
                'vehicle:id,name,plate_number,type',
                'partner:id,name,code',
                'driver:id,name',
            ])
            ->when(request('status'), fn ($q, $s) => $q->where('status', $s))
            ->when(request('search'), fn ($q, $s) => $q->where(function ($q) use ($s): void {
                $q->where('code', 'like', "%{$s}%")
                    ->orWhereHas('partner', fn ($q) => $q->where('name', 'like', "%{$s}%"));
            }))
            ->latest()
            ->paginate(25)
            ->withQueryString();

        return Inertia::render('Modules/Rental/Index', [
            'rentals' => $rentals,
            'filters' => request()->only('status', 'search'),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Modules/Rental/Create', [
            'vehicles' => Vehicle::query()
                ->where('status', Vehicle::STATUS_ACTIVE)
                ->orderBy('name')
                ->get(['id', 'name', 'plate_number', 'type']),
            'drivers' => Driver::query()
                ->where('status', Driver::STATUS_AVAILABLE)
                ->orderBy('name')
                ->get(['id', 'name', 'phone']),
            'partners' => Partner::query()
                ->orderBy('name')
                ->get(['id', 'name', 'code']),
            'rates' => RentalRate::query()
                ->where('is_active', true)
                ->orderBy('name')
                ->get(),
        ]);
    }

    public function store(StoreRentalRequest $request): RedirectResponse
    {
        $validated = $request->validated();
        $totalPeriods = Rental::computePeriods($validated['start_date'], $validated['end_date'], $validated['period_type']);
        $rate = (float) $validated['rate_per_period'];

        $rental = Rental::create(array_merge($validated, [
            'code' => Rental::nextCode(),
            'total_periods' => $totalPeriods,
            'base_amount' => $rate * $totalPeriods,
            'excess_amount' => 0,
            'deposit_amount' => $validated['deposit_amount'] ?? 0,
            'total_amount' => $rate * $totalPeriods,
            'status' => Rental::STATUS_DRAFT,
        ]));

        return redirect()->route($this->getRoutePrefix().'.rental.show', $rental)
            ->with('success', 'Rental created.');
    }

    public function show(Rental $rental): Response
    {
        $rental->load([
            'vehicle:id,name,plate_number,type,status',
            'driver:id,name,phone',
            'partner:id,name,code,phone',
            'confirmedBy:id,name',
            'extensions',
            'damages',
        ]);

        return Inertia::render('Modules/Rental/Show', [
            'rental' => $rental->append('is_overdue'),
        ]);
    }

    public function edit(Rental $rental): Response
    {
        abort_if(
            ! in_array($rental->status, [Rental::STATUS_DRAFT, Rental::STATUS_CONFIRMED]),
            403,
            'Only draft or confirmed rentals can be edited.',
        );

        $rental->load(['vehicle:id,name,plate_number,type', 'driver:id,name', 'partner:id,name,code']);

        return Inertia::render('Modules/Rental/Edit', [
            'rental' => $rental,
            'vehicles' => Vehicle::query()
                ->where('status', Vehicle::STATUS_ACTIVE)
                ->orderBy('name')
                ->get(['id', 'name', 'plate_number', 'type']),
            'drivers' => Driver::query()
                ->where('status', Driver::STATUS_AVAILABLE)
                ->orderBy('name')
                ->get(['id', 'name', 'phone']),
            'partners' => Partner::query()
                ->orderBy('name')
                ->get(['id', 'name', 'code']),
            'rates' => RentalRate::query()
                ->where('is_active', true)
                ->orderBy('name')
                ->get(),
        ]);
    }

    public function update(UpdateRentalRequest $request, Rental $rental): RedirectResponse
    {
        abort_if(
            ! in_array($rental->status, [Rental::STATUS_DRAFT, Rental::STATUS_CONFIRMED]),
            403,
            'Only draft or confirmed rentals can be edited.',
        );

        $validated = $request->validated();
        $totalPeriods = Rental::computePeriods($validated['start_date'], $validated['end_date'], $validated['period_type']);
        $rate = (float) $validated['rate_per_period'];

        $rental->update(array_merge($validated, [
            'total_periods' => $totalPeriods,
            'base_amount' => $rate * $totalPeriods,
            'deposit_amount' => $validated['deposit_amount'] ?? 0,
            'total_amount' => $rate * $totalPeriods,
        ]));

        return redirect()->route($this->getRoutePrefix().'.rental.show', $rental)
            ->with('success', 'Rental updated.');
    }

    public function destroy(Rental $rental): RedirectResponse
    {
        abort_if(
            $rental->status !== Rental::STATUS_DRAFT,
            403,
            'Only draft rentals can be deleted.',
        );

        $rental->delete();

        return redirect()->route($this->getRoutePrefix().'.rental.index')
            ->with('success', 'Rental deleted.');
    }
}
