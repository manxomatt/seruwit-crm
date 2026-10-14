<?php

namespace Modules\Fleet\Http\Controllers;

use App\Http\Controllers\Controller;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Fleet\Models\Vehicle;
use Modules\Fleet\Support\VehicleSettlementCalculator;

class VehicleSettlementController extends Controller
{
    /**
     * Get the route prefix for this controller.
     */
    protected function getRoutePrefix(): string
    {
        return 'module';
    }

    /**
     * Display the settlement / performance statement page for a vehicle.
     */
    public function show(Request $request, Vehicle $vehicle, VehicleSettlementCalculator $calculator): Response
    {
        $vehicle->loadMissing([
            'partner.bankAccounts' => fn ($q) => $q->where('is_active', true),
            'homeBase:id,code,name',
        ]);

        $month = $request->query('month');
        $startDateParam = $request->query('start_date');
        $endDateParam = $request->query('end_date');

        if ($startDateParam && $endDateParam) {
            $startDate = Carbon::parse($startDateParam)->startOfDay();
            $endDate = Carbon::parse($endDateParam)->endOfDay();
        } elseif ($month && preg_match('/^\d{4}-\d{2}$/', $month)) {
            $startDate = Carbon::parse($month.'-01')->startOfMonth()->startOfDay();
            $endDate = $startDate->copy()->endOfMonth()->endOfDay();
        } else {
            $startDate = Carbon::now()->startOfMonth()->startOfDay();
            $endDate = Carbon::now()->endOfMonth()->endOfDay();
        }

        $settlement = $calculator->calculateForVehicle($vehicle, $startDate, $endDate);

        // Generate quick available month options (current + past 5 months)
        $monthOptions = [];
        $cursor = Carbon::now()->startOfMonth();
        for ($i = 0; $i < 6; $i++) {
            $val = $cursor->format('Y-m');
            $monthOptions[] = [
                'value' => $val,
                'label' => $cursor->translatedFormat('F Y'),
            ];
            $cursor->subMonth();
        }

        $tenant = tenant();
        $companyInfo = [
            'name' => $tenant instanceof \App\Models\Tenant ? ($tenant->name ?? config('app.name')) : config('app.name'),
            'subdomain' => $tenant instanceof \App\Models\Tenant ? $tenant->id : null,
            'email' => $tenant instanceof \App\Models\Tenant ? ($tenant->email ?? null) : null,
            'phone' => $tenant instanceof \App\Models\Tenant ? ($tenant->phone ?? null) : null,
            'address' => $tenant instanceof \App\Models\Tenant ? ($tenant->address ?? null) : null,
        ];

        return Inertia::render('Modules/Fleet/Vehicles/Settlement', [
            'settlement' => $settlement,
            'monthOptions' => $monthOptions,
            'currentFilter' => [
                'month' => $month ?? $startDate->format('Y-m'),
                'start_date' => $startDate->toDateString(),
                'end_date' => $endDate->toDateString(),
            ],
            'company' => $companyInfo,
        ]);
    }
}
