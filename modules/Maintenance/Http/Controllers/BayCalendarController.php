<?php

namespace Modules\Maintenance\Http\Controllers;

use App\Http\Controllers\Controller;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Maintenance\Models\MaintenanceBay;
use Modules\Maintenance\Models\WorkOrder;

class BayCalendarController extends Controller
{
    public function index(): Response
    {
        $user = Auth::user();
        $start = Carbon::parse(request('start', now()->toDateString()))->startOfDay();
        $days = max(1, min(14, (int) request('days', 7)));
        $end = $start->copy()->addDays($days - 1)->endOfDay();

        $dateKeys = collect(range(0, $days - 1))
            ->map(fn (int $offset): string => $start->copy()->addDays($offset)->toDateString())
            ->values();

        $bays = MaintenanceBay::query()
            ->active()
            ->ordered()
            ->get(['id', 'code', 'name']);

        $workOrders = WorkOrder::query()
            ->with(['vehicle:id,name,plate_number', 'mechanic:id,name', 'bay:id,code,name'])
            ->whereNotNull('bay_id')
            ->whereNotNull('scheduled_date')
            ->whereBetween('scheduled_date', [$start->toDateString(), $end->toDateString()])
            ->whereNotIn('status', [WorkOrder::STATUS_CANCELLED])
            ->orderBy('scheduled_date')
            ->orderByRaw("CASE priority WHEN 'urgent' THEN 0 WHEN 'high' THEN 1 WHEN 'normal' THEN 2 ELSE 3 END")
            ->get();

        $cells = [];
        foreach ($bays as $bay) {
            foreach ($dateKeys as $date) {
                $cells[$bay->id][$date] = [];
            }
        }

        foreach ($workOrders as $workOrder) {
            $date = $workOrder->scheduled_date?->toDateString();
            $bayId = $workOrder->bay_id;

            if ($date === null || $bayId === null || ! isset($cells[$bayId][$date])) {
                continue;
            }

            $cells[$bayId][$date][] = [
                'id' => $workOrder->id,
                'reference_number' => $workOrder->reference_number,
                'title' => $workOrder->title,
                'status' => $workOrder->status,
                'priority' => $workOrder->priority,
                'vehicle' => $workOrder->vehicle
                    ? [
                        'id' => $workOrder->vehicle->id,
                        'name' => $workOrder->vehicle->name,
                        'plate_number' => $workOrder->vehicle->plate_number,
                    ]
                    : null,
                'mechanic' => $workOrder->mechanic
                    ? ['id' => $workOrder->mechanic->id, 'name' => $workOrder->mechanic->name]
                    : null,
            ];
        }

        return Inertia::render('Modules/Maintenance/Calendar/Index', [
            'bays' => $bays,
            'dates' => $dateKeys,
            'cells' => $cells,
            'filters' => [
                'start' => $start->toDateString(),
                'days' => $days,
            ],
            'can' => [
                'create' => $user->hasPermissionFor('maintenance', 'create'),
            ],
        ]);
    }
}
