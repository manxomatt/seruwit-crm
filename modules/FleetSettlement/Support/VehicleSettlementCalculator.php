<?php

namespace Modules\FleetSettlement\Support;

use App\Modules\Facades\Modules;
use Carbon\Carbon;
use Illuminate\Support\Collection;
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

        if ($vehicle->ownership_type === 'owned') {
            $maintenanceDeduction = 0.0;
            $maintenancePayerLabel = 'Milik Sendiri (0% dipotong)';
        } elseif ($payer === 'owner') {
            $maintenanceDeduction = $totalMaintenanceCost;
            $maintenancePayerLabel = 'Ditanggung Pemilik (100% dipotong dari hak bagi hasil)';
        } elseif ($payer === 'shared') {
            $maintenanceDeduction = round($totalMaintenanceCost * 0.5, 2);
            $maintenancePayerLabel = 'Bagi Dua / 50:50 (50% dipotong dari hak bagi hasil)';
        } else {
            // tenant pays
            $maintenanceDeduction = 0.0;
            $maintenancePayerLabel = 'Ditanggung Rental (0% dipotong dari hak bagi hasil)';
        }

        $netPayout = max(0.0, round($ownerGrossShare - $maintenanceDeduction, 2));

        $partnerData = $vehicle->partner ? [
            'id' => $vehicle->partner->id,
            'code' => $vehicle->partner->code,
            'name' => $vehicle->partner->name,
            'phone' => $vehicle->partner->phone,
            'bank_accounts' => $vehicle->partner->bankAccounts?->map(fn ($b): array => [
                'id' => $b->id,
                'bank_name' => $b->bank_name,
                'account_number' => $b->account_number,
                'account_holder' => $b->account_holder,
                'is_primary' => (bool) $b->is_primary,
            ]),
        ] : null;

        $summaryData = [
            'total_orders' => $totalOrders,
            'total_rental_days' => $totalRentalDays,
            'utilization_pct' => min(100.0, round(($totalRentalDays / max(1, $startDate->daysInMonth)) * 100, 1)),
            'total_revenue' => $totalRevenue,
            'scheme_label' => $schemeLabel,
            'owner_gross_share' => $ownerGrossShare,
            'tenant_gross_share' => $tenantGrossShare,
            'total_maintenance_cost' => $totalMaintenanceCost,
            'maintenance_deduction' => $maintenanceDeduction,
            'net_payout' => $netPayout,
        ];

        return [
            'vehicle' => [
                'id' => $vehicle->id,
                'name' => $vehicle->name,
                'plate_number' => $vehicle->plate_number,
                'ownership_type' => $vehicle->ownership_type ?? 'investor',
                'settlement_scheme' => $scheme,
                'scheme_label' => $schemeLabel,
                'revenue_share_owner_pct' => $ownerPct,
                'revenue_share_tenant_pct' => $tenantPct,
                'fixed_fee_amount' => $fixedFee,
                'maintenance_payer' => $payer,
                'maintenance_payer_label' => $maintenancePayerLabel,
                'partner' => $partnerData,
                'home_base' => $vehicle->homeBase ? [
                    'id' => $vehicle->homeBase->id,
                    'code' => $vehicle->homeBase->code,
                    'name' => $vehicle->homeBase->name,
                ] : null,
            ],
            'partner' => $partnerData,
            'period' => [
                'start_date' => $startDate->toDateString(),
                'end_date' => $endDate->toDateString(),
                'month' => $startDate->format('Y-m'),
                'month_name' => $startDate->translatedFormat('F Y'),
                'total_days_in_month' => $startDate->daysInMonth,
            ],
            'summary' => $summaryData,
            'metrics' => $summaryData,
            'breakdown' => [
                'rentals' => $rentals->values()->all(),
                'maintenance_logs' => $maintenanceLogs->values()->all(),
            ],
        ];
    }

    /**
     * Consolidate settlements across multiple vehicles belonging to a partner.
     *
     * @return array<string, mixed>
     */
    public function calculateForPartner(Partner $partner, Carbon $startDate, Carbon $endDate): array
    {
        $vehicles = Vehicle::query()
            ->where('partner_id', $partner->id)
            ->whereIn('ownership_type', ['investor', 'consignment'])
            ->with(['partner.bankAccounts', 'homeBase:id,code,name'])
            ->get();

        $vehicleResults = $vehicles->map(fn (Vehicle $v): array => $this->calculateForVehicle($v, $startDate, $endDate));

        $totalRevenue = (float) $vehicleResults->sum(fn ($r) => $r['metrics']['total_revenue']);
        $totalOwnerGross = (float) $vehicleResults->sum(fn ($r) => $r['metrics']['owner_gross_share']);
        $totalTenantGross = (float) $vehicleResults->sum(fn ($r) => $r['metrics']['tenant_gross_share']);
        $totalMaintenanceDeduction = (float) $vehicleResults->sum(fn ($r) => $r['metrics']['maintenance_deduction']);
        $totalNetPayout = (float) $vehicleResults->sum(fn ($r) => $r['metrics']['net_payout']);
        $totalOrders = (int) $vehicleResults->sum(fn ($r) => $r['metrics']['total_orders']);
        $totalRentalDays = (int) $vehicleResults->sum(fn ($r) => $r['metrics']['total_rental_days']);

        return [
            'partner' => [
                'id' => $partner->id,
                'code' => $partner->code,
                'name' => $partner->name,
                'phone' => $partner->phone,
                'email' => $partner->email,
                'bank_accounts' => $partner->bankAccounts?->map(fn ($b): array => [
                    'id' => $b->id,
                    'bank_name' => $b->bank_name,
                    'account_number' => $b->account_number,
                    'account_holder' => $b->account_holder,
                    'is_primary' => (bool) $b->is_primary,
                ]),
            ],
            'period' => [
                'start_date' => $startDate->toDateString(),
                'end_date' => $endDate->toDateString(),
                'month' => $startDate->format('Y-m'),
                'month_name' => $startDate->translatedFormat('F Y'),
            ],
            'totals' => [
                'total_vehicles' => $vehicles->count(),
                'total_orders' => $totalOrders,
                'total_rental_days' => $totalRentalDays,
                'total_revenue' => $totalRevenue,
                'owner_gross_share' => $totalOwnerGross,
                'tenant_gross_share' => $totalTenantGross,
                'maintenance_deduction' => $totalMaintenanceDeduction,
                'net_payout' => $totalNetPayout,
            ],
            'vehicles' => $vehicleResults->values()->all(),
        ];
    }

    /**
     * Get revenue-generating rental orders for a vehicle in range.
     *
     * @return Collection<int, array<string, mixed>>
     */
    protected function getRentalsForVehicle(int $vehicleId, Carbon $startDate, Carbon $endDate): Collection
    {
        $startDateStr = $startDate->toDateString();
        $endDateStr = $endDate->toDateString();

        if (class_exists(\Modules\Rental\Models\Rental::class)) {
            return \Modules\Rental\Models\Rental::query()
                ->where('vehicle_id', $vehicleId)
                ->where(function ($q) use ($startDateStr, $endDateStr) {
                    $q->whereBetween('start_date', [$startDateStr, $endDateStr])
                        ->orWhereBetween('end_date', [$startDateStr, $endDateStr])
                        ->orWhere(function ($sub) use ($startDateStr, $endDateStr) {
                            $sub->where('start_date', '<=', $startDateStr)
                                ->where('end_date', '>=', $endDateStr);
                        });
                })
                ->whereNotIn('status', [
                    \Modules\Rental\Models\Rental::STATUS_CANCELLED ?? 'cancelled',
                    'draft',
                ])
                ->with(['partner:id,name,phone'])
                ->get()
                ->map(function ($rental) use ($startDate, $endDate): array {
                    $rStart = Carbon::parse($rental->start_date);
                    $rEnd = Carbon::parse($rental->end_date);
                    $overlapStart = $rStart->greaterThan($startDate) ? $rStart : $startDate;
                    $overlapEnd = $rEnd->lessThan($endDate) ? $rEnd : $endDate;
                    $overlapDays = max(1, $overlapStart->diffInDays($overlapEnd) + 1);

                    return [
                        'id' => $rental->id,
                        'code' => $rental->code,
                        'customer_name' => $rental->partner?->name ?? 'Pelanggan Umum',
                        'start_date' => $rental->start_date?->toDateString() ?? (string) $rental->start_date,
                        'end_date' => $rental->end_date?->toDateString() ?? (string) $rental->end_date,
                        'days' => $overlapDays,
                        'status' => $rental->status,
                        'total_amount' => (float) ($rental->total_amount ?? 0),
                        'rate_per_period' => (float) ($rental->rate_per_period ?? 0),
                    ];
                });
        }

        return collect();
    }

    /**
     * Get maintenance logs / repair costs for a vehicle in range.
     *
     * @return Collection<int, array<string, mixed>>
     */
    protected function getMaintenanceLogsForVehicle(int $vehicleId, Carbon $startDate, Carbon $endDate): Collection
    {
        $startDateStr = $startDate->toDateString();
        $endDateStr = $endDate->toDateString();
        $items = collect();

        // 1. Check Work Orders from Maintenance module if available
        if (class_exists(\Modules\Maintenance\Models\WorkOrder::class) && Modules::available('maintenance')) {
            $woLogs = \Modules\Maintenance\Models\WorkOrder::query()
                ->where('vehicle_id', $vehicleId)
                ->whereBetween('scheduled_date', [$startDateStr, $endDateStr])
                ->whereNotIn('status', ['cancelled'])
                ->get()
                ->map(fn ($wo): array => [
                    'id' => $wo->id,
                    'source' => 'work_order',
                    'reference' => $wo->code ?? "WO-{$wo->id}",
                    'date' => $wo->scheduled_date?->toDateString(),
                    'title' => $wo->title ?? 'Perawatan Bengkel',
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
