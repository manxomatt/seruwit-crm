<?php

namespace Modules\Partners\Http\Controllers;

use App\Http\Controllers\Controller;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Fleet\Models\Vehicle;
use Modules\Fleet\Support\VehicleSettlementCalculator;
use Modules\Partners\Models\Partner;

class PartnerSettlementController extends Controller
{
    /**
     * Get the route prefix for this controller.
     */
    protected function getRoutePrefix(): string
    {
        return 'module';
    }

    /**
     * Display consolidated settlement statement page for a partner and all their vehicles.
     */
    public function show(Request $request, Partner $partner, VehicleSettlementCalculator $calculator): Response
    {
        $partner->loadMissing([
            'bankAccounts' => fn ($q) => $q->where('is_active', true),
            'vehicles.homeBase:id,code,name',
        ]);

        $month = $request->query('month');
        $vehicleId = $request->query('vehicle_id');
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

        // If a specific vehicle of this partner is selected, calculate for that single vehicle
        if ($vehicleId && ($singleVehicle = $partner->vehicles->firstWhere('id', (int) $vehicleId))) {
            $settlement = $calculator->calculateForVehicle($singleVehicle, $startDate, $endDate);
            $isConsolidated = false;
        } else {
            $settlement = $calculator->calculateForPartner($partner, $startDate, $endDate);
            $isConsolidated = true;
        }

        $monthOptions = [];
        $cursor = Carbon::now()->startOfMonth()->addMonth();
        for ($i = 0; $i < 14; $i++) {
            $val = $cursor->format('Y-m');
            $monthOptions[] = [
                'value' => $val,
                'label' => $cursor->translatedFormat('F Y'),
            ];
            $cursor->subMonth();
        }

        if ($month && ! collect($monthOptions)->contains('value', $month)) {
            $parsedMonth = Carbon::parse($month.'-01');
            $monthOptions[] = [
                'value' => $month,
                'label' => $parsedMonth->translatedFormat('F Y'),
            ];
            usort($monthOptions, fn ($a, $b) => strcmp($b['value'], $a['value']));
        }

        $tenant = tenant();
        $companyInfo = [
            'name' => $tenant instanceof \App\Models\Tenant ? ($tenant->name ?? config('app.name')) : config('app.name'),
            'subdomain' => $tenant instanceof \App\Models\Tenant ? $tenant->id : null,
            'email' => $tenant instanceof \App\Models\Tenant ? ($tenant->email ?? null) : null,
            'phone' => $tenant instanceof \App\Models\Tenant ? ($tenant->phone ?? null) : null,
            'address' => $tenant instanceof \App\Models\Tenant ? ($tenant->address ?? null) : null,
        ];

        return Inertia::render('Modules/Partners/Settlement', [
            'settlement' => $settlement,
            'isConsolidated' => $isConsolidated,
            'partnerVehicles' => $partner->vehicles->map(fn (Vehicle $v): array => [
                'id' => $v->id,
                'name' => $v->name,
                'plate_number' => $v->plate_number,
                'type' => $v->type,
                'ownership_type' => $v->ownership_type,
                'settlement_scheme' => $v->settlement_scheme,
                'home_base' => $v->homeBase ? ['id' => $v->homeBase->id, 'name' => $v->homeBase->name] : null,
            ])->values()->all(),
            'monthOptions' => $monthOptions,
            'currentFilter' => [
                'month' => $month ?? $startDate->format('Y-m'),
                'vehicle_id' => $vehicleId ? (int) $vehicleId : null,
                'start_date' => $startDate->toDateString(),
                'end_date' => $endDate->toDateString(),
            ],
            'company' => $companyInfo,
        ]);
    }
}
