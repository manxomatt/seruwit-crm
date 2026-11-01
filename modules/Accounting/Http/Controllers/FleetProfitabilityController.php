<?php

namespace Modules\Accounting\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Accounting\Support\FleetProfitabilityService;
use Modules\Fleet\Models\Vehicle;
use Modules\FleetBase\Models\FleetBase;

class FleetProfitabilityController extends Controller
{
    public function getRoutePrefix(): string
    {
        return 'module';
    }

    /**
     * Vehicle Profitability Statement & Fleet Ranking Report.
     */
    public function vehicleIndex(Request $request, FleetProfitabilityService $service): Response
    {
        $from = $request->query('from', now()->startOfMonth()->toDateString());
        $to = $request->query('to', now()->toDateString());
        $vehicleId = $request->integer('vehicle_id');
        $fleetBaseId = $request->integer('fleet_base_id');

        $selectedVehicle = null;
        $vehicleDetail = null;

        if ($vehicleId > 0) {
            $selectedVehicle = Vehicle::query()
                ->with(['partner:id,name', 'homeBase:id,code,name'])
                ->find($vehicleId);

            if ($selectedVehicle) {
                $vehicleDetail = $service->vehicleProfitability($selectedVehicle, $from, $to);
            }
        }

        $summary = $service->fleetSummary($from, $to, $fleetBaseId ?: null);

        $vehicles = Vehicle::query()
            ->orderBy('plate_number')
            ->get(['id', 'plate_number', 'name', 'type', 'home_base_id']);

        $bases = FleetBase::query()->orderBy('name')->get(['id', 'code', 'name']);

        return Inertia::render('Modules/Accounting/Reports/VehicleProfitability', [
            'filters' => [
                'from' => $from,
                'to' => $to,
                'vehicle_id' => $vehicleId ?: null,
                'fleet_base_id' => $fleetBaseId ?: null,
            ],
            'kpi' => $summary['kpi'],
            'rows' => $summary['rows'],
            'selectedVehicle' => $vehicleDetail,
            'vehicles' => $vehicles,
            'bases' => $bases,
        ]);
    }

    /**
     * Pool / Branch Profitability Statement.
     */
    public function poolIndex(Request $request, FleetProfitabilityService $service): Response
    {
        $from = $request->query('from', now()->startOfMonth()->toDateString());
        $to = $request->query('to', now()->toDateString());

        $data = $service->poolProfitability($from, $to);

        return Inertia::render('Modules/Accounting/Reports/PoolProfitability', [
            'filters' => [
                'from' => $from,
                'to' => $to,
            ],
            'totals' => $data['totals'],
            'pools' => $data['pools'],
        ]);
    }
}
