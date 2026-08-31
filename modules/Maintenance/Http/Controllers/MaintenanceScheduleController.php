<?php

namespace Modules\Maintenance\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Fleet\Models\Vehicle;
use Modules\Maintenance\Http\Requests\StoreMaintenanceScheduleRequest;
use Modules\Maintenance\Models\MaintenanceCategory;
use Modules\Maintenance\Models\MaintenanceSchedule;

class MaintenanceScheduleController extends Controller
{
    protected function getRoutePrefix(): string
    {
        return 'module';
    }

    public function index(Request $request): Response
    {
        $user = Auth::user();

        $schedules = MaintenanceSchedule::query()
            ->with(['vehicle', 'category'])
            ->when($request->filled('search'), function ($query) use ($request) {
                $like = "%{$request->search}%";
                $query->where(function ($q) use ($like) {
                    $q->where('name', 'ilike', $like)
                        ->orWhere('notes', 'ilike', $like)
                        ->orWhereHas('vehicle', function ($vq) use ($like) {
                            $vq->where('name', 'ilike', $like)
                                ->orWhere('plate_number', 'ilike', $like);
                        });
                });
            })
            ->when($request->filled('vehicle_id'), fn ($q) => $q->where('vehicle_id', $request->vehicle_id))
            ->when($request->filled('is_active'), fn ($q) => $q->where('is_active', $request->is_active === '1'))
            ->orderBy('next_service_date')
            ->orderBy('next_service_odometer')
            ->paginate(20)
            ->withQueryString();

        $vehicles = Vehicle::query()->select('id', 'name', 'plate_number', 'odometer_km')->orderBy('name')->get();
        $categories = MaintenanceCategory::query()->orderBy('sort_order')->get();

        return Inertia::render('Modules/Maintenance/Schedules/Index', [
            'schedules' => $schedules,
            'vehicles' => $vehicles,
            'categories' => $categories,
            'filters' => [
                'search' => $request->query('search'),
                'vehicle_id' => $request->query('vehicle_id'),
                'is_active' => $request->query('is_active'),
            ],
            'can' => [
                'create' => $user->hasPermissionFor('maintenance', 'create'),
                'update' => $user->hasPermissionFor('maintenance', 'update'),
                'delete' => $user->hasPermissionFor('maintenance', 'delete'),
            ],
        ]);
    }

    public function store(StoreMaintenanceScheduleRequest $request): RedirectResponse
    {
        $schedule = MaintenanceSchedule::create($request->validated());
        $schedule->recalculateNextService();

        return back()->with('success', __('maintenance.messages.schedule_created'));
    }

    public function update(StoreMaintenanceScheduleRequest $request, MaintenanceSchedule $schedule): RedirectResponse
    {
        $schedule->update($request->validated());
        $schedule->recalculateNextService();

        return back()->with('success', __('maintenance.messages.schedule_updated'));
    }

    public function destroy(MaintenanceSchedule $schedule): RedirectResponse
    {
        $schedule->delete();

        return back()->with('success', __('maintenance.messages.schedule_deleted'));
    }
}
