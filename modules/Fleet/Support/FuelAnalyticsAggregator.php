<?php

namespace Modules\Fleet\Support;

use Carbon\Carbon;
use Modules\Fleet\Models\Driver;
use Modules\Fleet\Models\FuelLog;
use Modules\Fleet\Models\Vehicle;

/**
 * Aggregates fuel analytics for the Fleet compliance dashboard: efficiency
 * trends, monthly BBM cost, anomaly history, fleet ranking, and driver
 * fuel performance vs vehicle baseline.
 */
class FuelAnalyticsAggregator
{
    /**
     * @return array<string, mixed>
     */
    public function build(?int $vehicleId, string $period): array
    {
        $range = $this->resolveRange($period);

        return [
            'period' => $period,
            'range' => [
                'start' => $range['start']->toDateString(),
                'end' => $range['end']->toDateString(),
            ],
            'summary' => $this->summary($range['start'], $range['end'], $vehicleId),
            'monthly_costs' => $this->monthlyCosts($vehicleId),
            'efficiency_trend' => $this->efficiencyTrend($vehicleId),
            'fleet_ranking' => $this->fleetRanking($range['start'], $range['end']),
            'anomalies' => $this->anomalyHistory($range['start'], $range['end'], $vehicleId),
            'driver_performance' => $this->driverPerformance($range['start'], $range['end'], $vehicleId),
        ];
    }

    /**
     * @return array{start: Carbon, end: Carbon}
     */
    private function resolveRange(string $period): array
    {
        $end = Carbon::now()->endOfDay();

        return match ($period) {
            'quarter' => [
                'start' => Carbon::now()->subMonths(3)->startOfDay(),
                'end' => $end,
            ],
            'year' => [
                'start' => Carbon::now()->subYear()->startOfDay(),
                'end' => $end,
            ],
            default => [
                'start' => Carbon::now()->subDays(29)->startOfDay(),
                'end' => $end,
            ],
        };
    }

    /**
     * @return array{total_cost: float, total_liters: float, fill_count: int, avg_km_per_liter: float|null, anomaly_count: int, previous_total_cost: float}
     */
    private function summary(Carbon $start, Carbon $end, ?int $vehicleId): array
    {
        $days = max(1, (int) $start->diffInDays($end) + 1);
        $previousStart = $start->copy()->subDays($days);
        $previousEnd = $start->copy()->subSecond();

        $current = $this->costAggregate($start, $end, $vehicleId);
        $previous = $this->costAggregate($previousStart, $previousEnd, $vehicleId);

        $avgKmPerLiter = FuelLog::query()
            ->when($vehicleId, fn ($q) => $q->where('vehicle_id', $vehicleId))
            ->whereBetween('filled_at', [$start->toDateString(), $end->toDateString()])
            ->whereNotNull('km_per_liter')
            ->avg('km_per_liter');

        $anomalyCount = FuelLog::query()
            ->when($vehicleId, fn ($q) => $q->where('vehicle_id', $vehicleId))
            ->whereBetween('filled_at', [$start->toDateString(), $end->toDateString()])
            ->whereNotNull('anomaly_flags')
            ->count();

        return [
            'total_cost' => $current['cost'],
            'total_liters' => $current['liters'],
            'fill_count' => $current['count'],
            'avg_km_per_liter' => $avgKmPerLiter !== null ? round((float) $avgKmPerLiter, 2) : null,
            'anomaly_count' => $anomalyCount,
            'previous_total_cost' => $previous['cost'],
        ];
    }

    /**
     * @return array{cost: float, liters: float, count: int}
     */
    private function costAggregate(Carbon $start, Carbon $end, ?int $vehicleId): array
    {
        $row = FuelLog::query()
            ->when($vehicleId, fn ($q) => $q->where('vehicle_id', $vehicleId))
            ->whereBetween('filled_at', [$start->toDateString(), $end->toDateString()])
            ->selectRaw('coalesce(sum(cost), 0) as total_cost, coalesce(sum(liters), 0) as total_liters, count(*) as fill_count')
            ->first();

        return [
            'cost' => round((float) ($row->total_cost ?? 0), 2),
            'liters' => round((float) ($row->total_liters ?? 0), 2),
            'count' => (int) ($row->fill_count ?? 0),
        ];
    }

    /**
     * Last 12 calendar months of BBM spend.
     *
     * @return list<array{month: string, label: string, cost: float, liters: float}>
     */
    private function monthlyCosts(?int $vehicleId): array
    {
        $start = Carbon::now()->subMonths(11)->startOfMonth();

        $logs = FuelLog::query()
            ->when($vehicleId, fn ($q) => $q->where('vehicle_id', $vehicleId))
            ->where('filled_at', '>=', $start->toDateString())
            ->get(['filled_at', 'cost', 'liters']);

        $grouped = $logs->groupBy(fn (FuelLog $log): string => $log->filled_at->format('Y-m'));

        $points = [];

        for ($i = 0; $i < 12; $i++) {
            $month = $start->copy()->addMonths($i);
            $key = $month->format('Y-m');
            $bucket = $grouped->get($key, collect());

            $points[] = [
                'month' => $key,
                'label' => $month->translatedFormat('M Y'),
                'cost' => round((float) $bucket->sum('cost'), 2),
                'liters' => round((float) $bucket->sum('liters'), 2),
            ];
        }

        return $points;
    }

    /**
     * Last 10 fills with km/L for a vehicle (or fleet average series when null).
     *
     * @return list<array{filled_at: string, km_per_liter: float|null, vehicle: string, plate_number: string}>
     */
    private function efficiencyTrend(?int $vehicleId): array
    {
        $logs = FuelLog::query()
            ->with('vehicle:id,name,plate_number')
            ->when($vehicleId, fn ($q) => $q->where('vehicle_id', $vehicleId))
            ->whereNotNull('km_per_liter')
            ->latest('filled_at')
            ->latest('id')
            ->limit(10)
            ->get()
            ->reverse()
            ->values();

        return $logs->map(fn (FuelLog $log): array => [
            'filled_at' => $log->filled_at?->toDateString() ?? '',
            'km_per_liter' => $log->km_per_liter !== null ? round((float) $log->km_per_liter, 2) : null,
            'vehicle' => $log->vehicle?->name ?? '—',
            'plate_number' => $log->vehicle?->plate_number ?? '—',
        ])->all();
    }

    /**
     * Fleet-wide ranking by average km/L in the period.
     *
     * @return list<array{vehicle_id: int, name: string, plate_number: string, type: string|null, avg_km_per_liter: float, fill_count: int, expected_km_per_liter: float|null, vs_expected_pct: float|null}>
     */
    private function fleetRanking(Carbon $start, Carbon $end): array
    {
        $aggregates = FuelLog::query()
            ->whereBetween('filled_at', [$start->toDateString(), $end->toDateString()])
            ->whereNotNull('km_per_liter')
            ->selectRaw('vehicle_id, avg(km_per_liter) as avg_km_per_liter, count(*) as fill_count')
            ->groupBy('vehicle_id')
            ->havingRaw('count(*) >= 1')
            ->orderByDesc('avg_km_per_liter')
            ->limit(20)
            ->get();

        if ($aggregates->isEmpty()) {
            return [];
        }

        $vehicles = Vehicle::query()
            ->whereIn('id', $aggregates->pluck('vehicle_id'))
            ->get(['id', 'name', 'plate_number', 'type', 'expected_km_per_liter'])
            ->keyBy('id');

        return $aggregates->map(function ($row) use ($vehicles): ?array {
            $vehicle = $vehicles->get($row->vehicle_id);

            if (! $vehicle) {
                return null;
            }

            $avg = round((float) $row->avg_km_per_liter, 2);
            $expected = $vehicle->expected_km_per_liter !== null
                ? (float) $vehicle->expected_km_per_liter
                : null;

            return [
                'vehicle_id' => $vehicle->id,
                'name' => $vehicle->name,
                'plate_number' => $vehicle->plate_number,
                'type' => $vehicle->type,
                'avg_km_per_liter' => $avg,
                'fill_count' => (int) $row->fill_count,
                'expected_km_per_liter' => $expected,
                'vs_expected_pct' => $expected && $expected > 0
                    ? round((($avg - $expected) / $expected) * 100, 1)
                    : null,
            ];
        })->filter()->values()->all();
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function anomalyHistory(Carbon $start, Carbon $end, ?int $vehicleId): array
    {
        return FuelLog::query()
            ->with(['vehicle:id,name,plate_number', 'driver:id,name'])
            ->when($vehicleId, fn ($q) => $q->where('vehicle_id', $vehicleId))
            ->whereBetween('filled_at', [$start->toDateString(), $end->toDateString()])
            ->whereNotNull('anomaly_flags')
            ->latest('filled_at')
            ->latest('id')
            ->limit(50)
            ->get()
            ->map(fn (FuelLog $log): array => [
                'id' => $log->id,
                'filled_at' => $log->filled_at?->toDateString(),
                'liters' => (float) $log->liters,
                'cost' => (float) $log->cost,
                'km_per_liter' => $log->km_per_liter !== null ? (float) $log->km_per_liter : null,
                'anomaly_flags' => $log->anomaly_flags ?? [],
                'vehicle' => $log->vehicle,
                'driver' => $log->driver,
            ])
            ->all();
    }

    /**
     * Driver efficiency vs the vehicle's average km/L over the same period.
     *
     * @return list<array{driver_id: int, driver_name: string, fill_count: int, avg_km_per_liter: float, vehicle_baseline: float|null, delta_pct: float|null}>
     */
    private function driverPerformance(Carbon $start, Carbon $end, ?int $vehicleId): array
    {
        $driverRows = FuelLog::query()
            ->when($vehicleId, fn ($q) => $q->where('vehicle_id', $vehicleId))
            ->whereBetween('filled_at', [$start->toDateString(), $end->toDateString()])
            ->whereNotNull('driver_id')
            ->whereNotNull('km_per_liter')
            ->selectRaw('driver_id, avg(km_per_liter) as avg_km_per_liter, count(*) as fill_count')
            ->groupBy('driver_id')
            ->havingRaw('count(*) >= 1')
            ->orderByDesc('avg_km_per_liter')
            ->limit(20)
            ->get();

        if ($driverRows->isEmpty()) {
            return [];
        }

        $driverNames = Driver::query()
            ->whereIn('id', $driverRows->pluck('driver_id'))
            ->pluck('name', 'id');

        $vehicleBaselines = FuelLog::query()
            ->when($vehicleId, fn ($q) => $q->where('vehicle_id', $vehicleId))
            ->whereBetween('filled_at', [$start->toDateString(), $end->toDateString()])
            ->whereNotNull('km_per_liter')
            ->selectRaw('vehicle_id, avg(km_per_liter) as avg_km_per_liter')
            ->groupBy('vehicle_id')
            ->pluck('avg_km_per_liter', 'vehicle_id');

        $fleetBaseline = FuelLog::query()
            ->when($vehicleId, fn ($q) => $q->where('vehicle_id', $vehicleId))
            ->whereBetween('filled_at', [$start->toDateString(), $end->toDateString()])
            ->whereNotNull('km_per_liter')
            ->avg('km_per_liter');

        $driverVehicleMix = FuelLog::query()
            ->when($vehicleId, fn ($q) => $q->where('vehicle_id', $vehicleId))
            ->whereBetween('filled_at', [$start->toDateString(), $end->toDateString()])
            ->whereNotNull('driver_id')
            ->whereNotNull('km_per_liter')
            ->selectRaw('driver_id, vehicle_id, count(*) as fills')
            ->groupBy('driver_id', 'vehicle_id')
            ->get()
            ->groupBy('driver_id');

        return $driverRows->map(function ($row) use ($driverNames, $driverVehicleMix, $vehicleBaselines, $fleetBaseline): array {
            $driverAvg = round((float) $row->avg_km_per_liter, 2);
            $mix = $driverVehicleMix->get($row->driver_id, collect());

            $baseline = null;
            if ($mix->isNotEmpty()) {
                $weighted = 0.0;
                $weight = 0;
                foreach ($mix as $part) {
                    $vAvg = (float) ($vehicleBaselines[$part->vehicle_id] ?? 0);
                    if ($vAvg <= 0) {
                        continue;
                    }
                    $fills = (int) $part->fills;
                    $weighted += $vAvg * $fills;
                    $weight += $fills;
                }
                $baseline = $weight > 0 ? round($weighted / $weight, 2) : null;
            }

            if ($baseline === null && $fleetBaseline !== null) {
                $baseline = round((float) $fleetBaseline, 2);
            }

            return [
                'driver_id' => (int) $row->driver_id,
                'driver_name' => $driverNames[$row->driver_id] ?? '—',
                'fill_count' => (int) $row->fill_count,
                'avg_km_per_liter' => $driverAvg,
                'vehicle_baseline' => $baseline,
                'delta_pct' => $baseline && $baseline > 0
                    ? round((($driverAvg - $baseline) / $baseline) * 100, 1)
                    : null,
            ];
        })->all();
    }
}
