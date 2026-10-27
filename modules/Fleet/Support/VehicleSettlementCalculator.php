<?php

namespace Modules\Fleet\Support;

use App\Modules\Facades\Modules;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Modules\Fleet\Contracts\VehicleRevenueSource;
use Modules\Fleet\Models\Vehicle;
use Modules\Fleet\Models\VehicleMaintenanceLog;
use Modules\Partners\Models\Partner;

class VehicleSettlementCalculator
{
    /**
     * Calculate settlement and performance data for a single vehicle in a date range.
     *
     * @return array<string, mixed>
     */
    public function calculateForVehicle(Vehicle $vehicle, Carbon $startDate, Carbon $endDate): array
    {
        $vehicle->loadMissing([
            'partner.bankAccounts' => fn ($q) => $q->where('is_active', true),
            'homeBase:id,code,name',
        ]);

        $rentals = $this->getRentalsForVehicle($vehicle->id, $startDate, $endDate);
        $maintenanceLogs = $this->getMaintenanceLogsForVehicle($vehicle->id, $startDate, $endDate);

        $totalRevenue = (float) $rentals->sum('total_amount');
        $totalRentalDays = (int) $rentals->sum('days');
        $totalOrders = $rentals->count();
        $totalMaintenanceCost = (float) $maintenanceLogs->sum('cost');

        $scheme = $vehicle->settlement_scheme ?? 'revenue_share';
        $ownerPct = (float) ($vehicle->revenue_share_owner_pct ?? 70);
        $tenantPct = (float) ($vehicle->revenue_share_tenant_pct ?? (100 - $ownerPct));
        $fixedFee = (float) ($vehicle->fixed_fee_amount ?? 0);

        $ownerGrossShare = 0.0;
        $tenantGrossShare = 0.0;
        $schemeLabel = '';

        if ($vehicle->ownership_type === 'owned') {
            $schemeLabel = 'Milik Sendiri (100% Tenant)';
            $ownerGrossShare = 0.0;
            $tenantGrossShare = $totalRevenue;
        } elseif ($scheme === 'revenue_share') {
            $schemeLabel = "Bagi Hasil ({$ownerPct}% Pemilik : {$tenantPct}% Rental)";
            $ownerGrossShare = round($totalRevenue * ($ownerPct / 100), 2);
            $tenantGrossShare = round($totalRevenue - $ownerGrossShare, 2);
        } elseif ($scheme === 'fixed_monthly') {
            $schemeLabel = 'Sewa Bulanan Tetap (Rp '.number_format($fixedFee, 0, ',', '.').'/bln)';
            $ownerGrossShare = $fixedFee;
            $tenantGrossShare = max(0.0, round($totalRevenue - $fixedFee, 2));
        } elseif ($scheme === 'daily_rental') {
            $schemeLabel = 'Sewa Harian Rekanan (Rp '.number_format($fixedFee, 0, ',', '.').'/hari)';
            $ownerGrossShare = round($fixedFee * $totalRentalDays, 2);
            $tenantGrossShare = max(0.0, round($totalRevenue - $ownerGrossShare, 2));
        }

        $payer = $vehicle->maintenance_payer ?? 'tenant';
        $maintenanceDeduction = 0.0;
        $maintenancePayerLabel = '';

        if ($payer === 'owner') {
            $maintenanceDeduction = $totalMaintenanceCost;
            $maintenancePayerLabel = 'Ditanggung Pemilik (100% dipotong dari hak bagi hasil)';
        } elseif ($payer === 'shared') {
            $maintenanceDeduction = round($totalMaintenanceCost * 0.5, 2);
            $maintenancePayerLabel = 'Bagi Dua / 50:50 (50% dipotong dari hak bagi hasil)';
        } else {
            $maintenanceDeduction = 0.0;
            $maintenancePayerLabel = 'Ditanggung Rental (0% dipotong dari hak bagi hasil)';
        }

        $netPayout = max(0.0, round($ownerGrossShare - $maintenanceDeduction, 2));

        return [
            'vehicle' => [
                'id' => $vehicle->id,
                'name' => $vehicle->name,
                'plate_number' => $vehicle->plate_number,
                'type' => $vehicle->type,
                'brand' => $vehicle->brand,
                'model_year' => $vehicle->model_year,
                'color' => $vehicle->color,
                'ownership_type' => $vehicle->ownership_type,
                'contract_number' => $vehicle->contract_number,
                'contract_start_date' => $vehicle->contract_start_date?->toDateString(),
                'contract_end_date' => $vehicle->contract_end_date?->toDateString(),
                'settlement_scheme' => $vehicle->settlement_scheme,
                'revenue_share_owner_pct' => $ownerPct,
                'revenue_share_tenant_pct' => $tenantPct,
                'fixed_fee_amount' => $fixedFee,
                'maintenance_payer' => $payer,
                'home_base' => $vehicle->homeBase ? [
                    'id' => $vehicle->homeBase->id,
                    'code' => $vehicle->homeBase->code,
                    'name' => $vehicle->homeBase->name,
                ] : null,
            ],
            'partner' => $vehicle->partner ? [
                'id' => $vehicle->partner->id,
                'code' => $vehicle->partner->code,
                'name' => $vehicle->partner->name,
                'phone' => $vehicle->partner->phone ?? $vehicle->partner->mobile,
                'email' => $vehicle->partner->email,
                'bank_accounts' => $vehicle->partner->bankAccounts->map(fn ($b) => [
                    'id' => $b->id,
                    'bank_name' => $b->bank_name,
                    'account_number' => $b->account_number,
                    'account_holder_name' => $b->account_holder_name,
                ])->values()->all(),
            ] : null,
            'period' => [
                'start_date' => $startDate->toDateString(),
                'end_date' => $endDate->toDateString(),
                'month_label' => $startDate->translatedFormat('F Y'),
                'days_count' => $startDate->diffInDays($endDate) + 1,
            ],
            'summary' => [
                'total_revenue' => $totalRevenue,
                'total_rental_days' => $totalRentalDays,
                'total_orders' => $totalOrders,
                'scheme_label' => $schemeLabel,
                'owner_gross_share' => $ownerGrossShare,
                'tenant_gross_share' => $tenantGrossShare,
                'total_maintenance_cost' => $totalMaintenanceCost,
                'maintenance_deduction' => $maintenanceDeduction,
                'maintenance_payer_label' => $maintenancePayerLabel,
                'net_payout' => $netPayout,
            ],
            'rentals' => $rentals->values()->all(),
            'maintenance_logs' => $maintenanceLogs->values()->all(),
        ];
    }

    /**
     * Calculate settlement data for all vehicles belonging to a partner.
     *
     * @return array<string, mixed>
     */
    public function calculateForPartner(Partner $partner, Carbon $startDate, Carbon $endDate): array
    {
        $partner->loadMissing([
            'bankAccounts' => fn ($q) => $q->where('is_active', true),
            'vehicles.homeBase:id,code,name',
        ]);

        $vehicleReports = [];
        $totalCombinedRevenue = 0.0;
        $totalCombinedRentalDays = 0;
        $totalCombinedOrders = 0;
        $totalCombinedOwnerGross = 0.0;
        $totalCombinedMaintenanceDeduction = 0.0;
        $totalCombinedNetPayout = 0.0;

        foreach ($partner->vehicles as $vehicle) {
            $rep = $this->calculateForVehicle($vehicle, $startDate, $endDate);
            $vehicleReports[] = $rep;

            $totalCombinedRevenue += $rep['summary']['total_revenue'];
            $totalCombinedRentalDays += $rep['summary']['total_rental_days'];
            $totalCombinedOrders += $rep['summary']['total_orders'];
            $totalCombinedOwnerGross += $rep['summary']['owner_gross_share'];
            $totalCombinedMaintenanceDeduction += $rep['summary']['maintenance_deduction'];
            $totalCombinedNetPayout += $rep['summary']['net_payout'];
        }

        return [
            'partner' => [
                'id' => $partner->id,
                'code' => $partner->code,
                'name' => $partner->name,
                'phone' => $partner->phone ?? $partner->mobile,
                'email' => $partner->email,
                'bank_accounts' => $partner->bankAccounts->map(fn ($b) => [
                    'id' => $b->id,
                    'bank_name' => $b->bank_name,
                    'account_number' => $b->account_number,
                    'account_holder_name' => $b->account_holder_name,
                ])->values()->all(),
            ],
            'period' => [
                'start_date' => $startDate->toDateString(),
                'end_date' => $endDate->toDateString(),
                'month_label' => $startDate->translatedFormat('F Y'),
                'days_count' => $startDate->diffInDays($endDate) + 1,
            ],
            'combined_summary' => [
                'total_vehicles' => count($vehicleReports),
                'total_revenue' => $totalCombinedRevenue,
                'total_rental_days' => $totalCombinedRentalDays,
                'total_orders' => $totalCombinedOrders,
                'owner_gross_share' => $totalCombinedOwnerGross,
                'maintenance_deduction' => $totalCombinedMaintenanceDeduction,
                'net_payout' => $totalCombinedNetPayout,
            ],
            'vehicle_reports' => $vehicleReports,
        ];
    }

    /**
     * @return Collection<int, array<string, mixed>>
     */
    private function getRentalsForVehicle(int $vehicleId, Carbon $startDate, Carbon $endDate): Collection
    {
        if (! Modules::available('rental') || ! app()->bound(VehicleRevenueSource::class)) {
            return collect();
        }

        return app(VehicleRevenueSource::class)->getVehicleRevenueItems($vehicleId, $startDate, $endDate);
    }

    /**
     * @return Collection<int, array<string, mixed>>
     */
    private function getMaintenanceLogsForVehicle(int $vehicleId, Carbon $startDate, Carbon $endDate): Collection
    {
        $items = collect();
        $startDateStr = $startDate->toDateString();
        $endDateStr = $endDate->toDateString();

        // 1. Maintenance Module WorkOrders (if available)
        if (\App\Modules\Facades\Modules::available('maintenance') && class_exists(\Modules\Maintenance\Models\WorkOrder::class)) {
            $woLogs = \Modules\Maintenance\Models\WorkOrder::query()
                ->where('vehicle_id', $vehicleId)
                ->where(function ($q) use ($startDate, $endDate, $startDateStr, $endDateStr) {
                    $q->whereBetween('completed_at', [$startDate, $endDate])
                        ->orWhereBetween('scheduled_date', [$startDateStr, $endDateStr]);
                })
                ->get()
                ->map(fn ($wo): array => [
                    'id' => $wo->id,
                    'source' => 'work_order',
                    'reference' => $wo->reference_number ?? "WO-{$wo->id}",
                    'date' => ($wo->completed_at ?? $wo->scheduled_date)?->toDateString(),
                    'title' => $wo->title,
                    'status' => $wo->status,
                    'cost' => (float) ($wo->actual_total_cost ?? 0),
                ]);

            $items = $items->merge($woLogs);
        }

        // 2. Direct Fleet Maintenance Logs
        $localLogs = VehicleMaintenanceLog::query()
            ->where('vehicle_id', $vehicleId)
            ->where(function ($q) use ($startDateStr, $endDateStr) {
                $q->whereBetween('scheduled_date', [$startDateStr, $endDateStr])
                    ->orWhereBetween('completed_date', [$startDateStr, $endDateStr]);
            })
            ->get()
            ->map(fn ($log): array => [
                'id' => $log->id,
                'source' => 'fleet_log',
                'reference' => "LOG-{$log->id}",
                'date' => ($log->completed_date ?? $log->scheduled_date)?->toDateString(),
                'title' => $log->description,
                'status' => $log->status,
                'cost' => (float) ($log->cost ?? 0),
            ]);

        return $items->merge($localLogs);
    }
}
