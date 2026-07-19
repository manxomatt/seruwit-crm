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

    public function index(): Response
    {
        $user = Auth::user();

        $schedules = MaintenanceSchedule::query()
            ->with(['vehicle', 'category'])
            ->when(request('vehicle_id'), fn ($q, $v) => $q->where('vehicle_id', $v))
            ->when(request('is_active') !== null, fn ($q) => $q->where('is_active', request('is_active') === '1'))
            ->orderBy('next_service_date')
            ->orderBy('next_service_odometer')
            ->paginate(20)
            ->withQueryString();

        $vehicles = Vehicle::query()->select('id', 'name', 'plate_number')->orderBy('name')->get();
        $categories = MaintenanceCategory::query()->orderBy('sort_order')->get();

        return Inertia::render('Modules/Maintenance/Schedules/Index', [
            'schedules' => $schedules,
            'vehicles' => $vehicles,
            'categories' => $categories,
            'filters' => [
                'vehicle_id' => request('vehicle_id'),
                'is_active' => request('is_active'),
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

        return back()->with('success', 'Jadwal perawatan berhasil ditambahkan.');
    }

    public function update(StoreMaintenanceScheduleRequest $request, MaintenanceSchedule $schedule): RedirectResponse
    {
        $schedule->update($request->validated());
        $schedule->recalculateNextService();

        return back()->with('success', 'Jadwal perawatan berhasil diperbarui.');
    }

    public function destroy(MaintenanceSchedule $schedule): RedirectResponse
    {
        $schedule->delete();

        return back()->with('success', 'Jadwal perawatan berhasil dihapus.');
    }
}
