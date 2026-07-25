<?php

namespace Modules\Fleet\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Fleet\Models\Vehicle;
use Modules\Fleet\Support\FuelAnalyticsAggregator;

class FuelAnalyticsController extends Controller
{
    public function index(Request $request, FuelAnalyticsAggregator $analytics): Response
    {
        $period = $request->query('period', 'month');
        if (! in_array($period, ['month', 'quarter', 'year'], true)) {
            $period = 'month';
        }

        $vehicleId = $request->integer('vehicle_id') ?: null;

        return Inertia::render('Modules/Fleet/Fuel/Analytics', [
            'analytics' => $analytics->build($vehicleId, $period),
            'vehicles' => Vehicle::query()->orderBy('name')->get(['id', 'name', 'plate_number']),
            'filters' => [
                'vehicle_id' => $vehicleId,
                'period' => $period,
            ],
        ]);
    }
}
