<?php

namespace Modules\TransportationManagement\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;
use Modules\TransportationManagement\Models\FuelLog;
use Modules\TransportationManagement\Models\Trip;
use Modules\TransportationManagement\Models\VehicleMaintenanceLog;

class ReportController extends Controller
{
    /**
     * Display the transportation reports: trip status breakdown, per-vehicle
     * utilization/distance, and fuel & maintenance cost totals, all scoped to
     * a date range.
     */
    public function index(): Response
    {
        $from = Carbon::parse(request('from', now()->startOfMonth()->toDateString()))->startOfDay();
        $to = Carbon::parse(request('to', now()->endOfMonth()->toDateString()))->endOfDay();

        $tripsByStatus = Trip::query()
            ->whereBetween('scheduled_at', [$from, $to])
            ->selectRaw('status, count(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status');

        $vehicleUtilization = Trip::query()
            ->with('vehicle:id,name,plate_number')
            ->whereBetween('scheduled_at', [$from, $to])
            ->selectRaw('vehicle_id, count(*) as trip_count, sum(distance_km) as total_distance_km')
            ->groupBy('vehicle_id')
            ->orderByDesc('trip_count')
            ->get();

        $driverUtilization = Trip::query()
            ->with('driver:id,name')
            ->whereBetween('scheduled_at', [$from, $to])
            ->selectRaw('driver_id, count(*) as trip_count')
            ->groupBy('driver_id')
            ->orderByDesc('trip_count')
            ->get();

        $fuelCostByVehicle = FuelLog::query()
            ->with('vehicle:id,name,plate_number')
            ->whereBetween('filled_at', [$from, $to])
            ->selectRaw('vehicle_id, sum(cost) as total_cost, sum(liters) as total_liters')
            ->groupBy('vehicle_id')
            ->orderByDesc('total_cost')
            ->get();

        $maintenanceCostByVehicle = VehicleMaintenanceLog::query()
            ->with('vehicle:id,name,plate_number')
            ->whereBetween('completed_date', [$from, $to])
            ->where('status', 'completed')
            ->selectRaw('vehicle_id, sum(cost) as total_cost, count(*) as log_count')
            ->groupBy('vehicle_id')
            ->orderByDesc('total_cost')
            ->get();

        return Inertia::render('Modules/TransportationManagement/Reports/Index', [
            'filters' => [
                'from' => $from->toDateString(),
                'to' => $to->toDateString(),
            ],
            'tripsByStatus' => $tripsByStatus,
            'vehicleUtilization' => $vehicleUtilization,
            'driverUtilization' => $driverUtilization,
            'fuelCostByVehicle' => $fuelCostByVehicle,
            'maintenanceCostByVehicle' => $maintenanceCostByVehicle,
        ]);
    }
}
