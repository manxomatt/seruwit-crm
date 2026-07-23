<?php

namespace Modules\TransportationManagement\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Fleet\Models\Driver;
use Modules\Fleet\Models\Vehicle;
use Modules\Partners\Models\Partner;
use Modules\TransportationManagement\Http\Requests\StoreTripScheduleRequest;
use Modules\TransportationManagement\Http\Requests\UpdateTripScheduleRequest;
use Modules\TransportationManagement\Models\TripSchedule;

class TripScheduleController extends Controller
{
    /**
     * Get the route prefix for this controller.
     */
    protected function getRoutePrefix(): string
    {
        return 'module';
    }

    /**
     * Display a listing of the trip schedules.
     */
    public function index(): Response
    {
        $user = Auth::user();

        $schedules = TripSchedule::query()
            ->with(['vehicle', 'driver', 'partner'])
            ->when(request('search'), function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('origin', 'like', "%{$search}%")
                        ->orWhere('destination', 'like', "%{$search}%");
                });
            })
            ->latest()
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Modules/TransportationManagement/Schedules/Index', [
            'schedules' => $schedules,
            'filters' => [
                'search' => request('search'),
            ],
            'can' => [
                'create' => $user->hasPermissionFor('transportation', 'create'),
                'update' => $user->hasPermissionFor('transportation', 'update'),
                'delete' => $user->hasPermissionFor('transportation', 'delete'),
            ],
        ]);
    }

    /**
     * Show the form for creating a new trip schedule.
     */
    public function create(): Response
    {
        return Inertia::render('Modules/TransportationManagement/Schedules/Create', [
            'vehicles' => Vehicle::query()->orderBy('name')->get(['id', 'name', 'plate_number', 'status']),
            'drivers' => Driver::query()->orderBy('name')->get(['id', 'name', 'license_number', 'status']),
            'partners' => Partner::query()->orderBy('name')->get(['id', 'code', 'name']),
        ]);
    }

    /**
     * Store a newly created trip schedule.
     */
    public function store(StoreTripScheduleRequest $request): RedirectResponse
    {
        $schedule = TripSchedule::create($request->validated());

        return redirect()->route($this->getRoutePrefix().'.transportation.schedules.show', $schedule)
            ->with('success', 'Schedule created successfully.');
    }

    /**
     * Display the specified trip schedule.
     */
    public function show(TripSchedule $schedule): Response
    {
        $user = Auth::user();

        $schedule->load(['vehicle', 'driver', 'partner']);
        $schedule->loadCount('trips');

        return Inertia::render('Modules/TransportationManagement/Schedules/Show', [
            'schedule' => $schedule,
            'can' => [
                'update' => $user->hasPermissionFor('transportation', 'update'),
                'delete' => $user->hasPermissionFor('transportation', 'delete'),
            ],
        ]);
    }

    /**
     * Show the form for editing the specified trip schedule.
     */
    public function edit(TripSchedule $schedule): Response
    {
        return Inertia::render('Modules/TransportationManagement/Schedules/Edit', [
            'schedule' => $schedule,
            'vehicles' => Vehicle::query()->orderBy('name')->get(['id', 'name', 'plate_number', 'status']),
            'drivers' => Driver::query()->orderBy('name')->get(['id', 'name', 'license_number', 'status']),
            'partners' => Partner::query()->orderBy('name')->get(['id', 'code', 'name']),
        ]);
    }

    /**
     * Update the specified trip schedule.
     */
    public function update(UpdateTripScheduleRequest $request, TripSchedule $schedule): RedirectResponse
    {
        $schedule->update($request->validated());

        return redirect()->route($this->getRoutePrefix().'.transportation.schedules.show', $schedule)
            ->with('success', 'Schedule updated successfully.');
    }

    /**
     * Remove the specified trip schedule. Trips already generated from it are
     * kept (trip_schedule_id is nulled by the FK, see the migration).
     */
    public function destroy(TripSchedule $schedule): RedirectResponse
    {
        $schedule->delete();

        return redirect()->route($this->getRoutePrefix().'.transportation.schedules.index')
            ->with('success', 'Schedule deleted successfully.');
    }

    /**
     * Generate real trips from every active schedule for the given date
     * range. Explicit, dispatcher-triggered — nothing runs this in the
     * background.
     */
    public function generate(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'from' => ['required', 'date'],
            'to' => ['required', 'date', 'after_or_equal:from'],
        ]);

        $from = Carbon::parse($validated['from'])->startOfDay();
        $to = Carbon::parse($validated['to'])->startOfDay();

        $createdCount = 0;
        $skipped = [];

        TripSchedule::query()->where('is_active', true)->each(function (TripSchedule $schedule) use ($from, $to, &$createdCount, &$skipped) {
            $result = $schedule->generateTripsBetween($from, $to);
            $createdCount += $result['created']->count();

            foreach ($result['skipped'] as $skip) {
                $skipped[] = "{$schedule->origin} → {$schedule->destination} ({$skip['date']}): {$skip['reason']}";
            }
        });

        $message = "{$createdCount} trip dibuat.";
        if ($skipped !== []) {
            $message .= ' '.count($skipped).' dilewati: '.implode('; ', array_slice($skipped, 0, 5));
            if (count($skipped) > 5) {
                $message .= ' (dan '.(count($skipped) - 5).' lainnya)';
            }
        }

        return back()->with('success', $message);
    }
}
