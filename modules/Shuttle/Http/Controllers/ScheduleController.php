<?php

namespace Modules\Shuttle\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Fleet\Models\Driver;
use Modules\Fleet\Models\Vehicle;
use Modules\Shuttle\Http\Requests\StoreScheduleRequest;
use Modules\Shuttle\Http\Requests\UpdateScheduleRequest;
use Modules\Shuttle\Models\ShuttleCorridor;
use Modules\Shuttle\Models\ShuttleSchedule;
use Modules\Shuttle\Support\ScheduleDepartureGenerator;

class ScheduleController extends Controller
{
    public function index(): Response
    {
        $schedules = ShuttleSchedule::query()
            ->with(['corridor', 'vehicle', 'driver'])
            ->orderBy('code')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Modules/Shuttle/Schedules/Index', [
            'schedules' => $schedules,
            'can' => [
                'create' => auth()->user()?->hasPermissionFor('shuttle', 'create') ?? false,
                'update' => auth()->user()?->hasPermissionFor('shuttle', 'update') ?? false,
                'delete' => auth()->user()?->hasPermissionFor('shuttle', 'delete') ?? false,
            ],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Modules/Shuttle/Schedules/Create', $this->formOptions());
    }

    public function store(StoreScheduleRequest $request): RedirectResponse
    {
        ShuttleSchedule::query()->create($request->validated());

        return redirect()->route('module.shuttle.schedules.index')
            ->with('success', __('shuttle.messages.schedule_created'));
    }

    public function edit(ShuttleSchedule $schedule): Response
    {
        return Inertia::render('Modules/Shuttle/Schedules/Edit', [
            'schedule' => $schedule,
            ...$this->formOptions(),
        ]);
    }

    public function update(UpdateScheduleRequest $request, ShuttleSchedule $schedule): RedirectResponse
    {
        $schedule->update($request->validated());

        return redirect()->route('module.shuttle.schedules.index')
            ->with('success', __('shuttle.messages.schedule_updated'));
    }

    public function destroy(ShuttleSchedule $schedule): RedirectResponse
    {
        $schedule->delete();

        return redirect()->route('module.shuttle.schedules.index')
            ->with('success', __('shuttle.messages.schedule_deleted'));
    }

    public function generate(Request $request, ShuttleSchedule $schedule, ScheduleDepartureGenerator $generator): RedirectResponse
    {
        $data = $request->validate([
            'from' => ['required', 'date'],
            'to' => ['required', 'date', 'after_or_equal:from'],
        ]);

        $result = $generator->generate(
            $schedule->load('vehicle', 'corridor'),
            Carbon::parse($data['from']),
            Carbon::parse($data['to']),
        );

        return back()->with('success', __('shuttle.messages.departures_generated', [
            'count' => $result['created']->count(),
            'skipped' => count($result['skipped']),
        ]));
    }

    /**
     * @return array{corridors: mixed, vehicles: mixed, drivers: mixed}
     */
    private function formOptions(): array
    {
        return [
            'corridors' => ShuttleCorridor::query()->where('is_active', true)->orderBy('code')->get(['id', 'code', 'name']),
            'vehicles' => Vehicle::query()->where('status', Vehicle::STATUS_ACTIVE)->orderBy('name')->get(['id', 'name', 'plate_number', 'capacity_seats']),
            'drivers' => Driver::query()->orderBy('name')->get(['id', 'name']),
        ];
    }
}
