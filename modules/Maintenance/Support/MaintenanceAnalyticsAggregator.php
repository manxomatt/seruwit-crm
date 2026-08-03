<?php

namespace Modules\Maintenance\Support;

use Carbon\Carbon;
use Illuminate\Support\Collection;
use Modules\Maintenance\Models\WorkOrder;

/**
 * Owner-facing maintenance insight: costs, downtime, and schedule compliance.
 */
class MaintenanceAnalyticsAggregator
{
    /**
     * @return array<string, mixed>
     */
    public function build(Carbon $from, Carbon $to): array
    {
        $completed = $this->completedInRange($from, $to);

        return [
            'summary' => $this->summary($completed, $from, $to),
            'by_vehicle' => $this->byVehicle($completed),
            'by_category' => $this->byCategory($completed),
            'by_vendor' => $this->byVendor($completed),
            'downtime' => $this->downtime($completed),
            'compliance' => $this->compliance($from, $to),
            'monthly_costs' => $this->monthlyCosts(),
        ];
    }

    /**
     * @return Collection<int, WorkOrder>
     */
    private function completedInRange(Carbon $from, Carbon $to): Collection
    {
        return WorkOrder::query()
            ->with([
                'vehicle:id,name,plate_number',
                'category:id,name,color',
                'vendorPartner:id,name,code',
            ])
            ->where('status', WorkOrder::STATUS_COMPLETED)
            ->whereNotNull('completed_at')
            ->whereBetween('completed_at', [$from, $to])
            ->get();
    }

    /**
     * @param  Collection<int, WorkOrder>  $completed
     * @return array{
     *     work_order_count: int,
     *     total_cost: float,
     *     labor_cost: float,
     *     parts_cost: float,
     *     avg_downtime_hours: float|null,
     *     compliance_pct: float|null
     * }
     */
    private function summary(Collection $completed, Carbon $from, Carbon $to): array
    {
        $labor = round((float) $completed->sum(fn (WorkOrder $wo): float => (float) ($wo->actual_labor_cost ?? 0)), 2);
        $parts = round((float) $completed->sum(fn (WorkOrder $wo): float => (float) ($wo->actual_parts_cost ?? 0)), 2);
        $compliance = $this->compliance($from, $to);
        $downtime = $this->downtime($completed);

        return [
            'work_order_count' => $completed->count(),
            'total_cost' => round($labor + $parts, 2),
            'labor_cost' => $labor,
            'parts_cost' => $parts,
            'avg_downtime_hours' => $downtime['avg_hours'],
            'compliance_pct' => $compliance['pct'],
        ];
    }

    /**
     * @param  Collection<int, WorkOrder>  $completed
     * @return list<array{vehicle_id: int|null, name: string, plate_number: string|null, work_order_count: int, labor_cost: float, parts_cost: float, total_cost: float, downtime_hours: float}>
     */
    private function byVehicle(Collection $completed): array
    {
        return $completed
            ->groupBy('vehicle_id')
            ->map(function (Collection $rows, $vehicleId): array {
                /** @var WorkOrder $first */
                $first = $rows->first();
                $labor = (float) $rows->sum(fn (WorkOrder $wo): float => (float) ($wo->actual_labor_cost ?? 0));
                $parts = (float) $rows->sum(fn (WorkOrder $wo): float => (float) ($wo->actual_parts_cost ?? 0));

                return [
                    'vehicle_id' => $vehicleId ? (int) $vehicleId : null,
                    'name' => $first->vehicle?->name ?? '—',
                    'plate_number' => $first->vehicle?->plate_number,
                    'work_order_count' => $rows->count(),
                    'labor_cost' => round($labor, 2),
                    'parts_cost' => round($parts, 2),
                    'total_cost' => round($labor + $parts, 2),
                    'downtime_hours' => round($this->sumDowntimeHours($rows), 2),
                ];
            })
            ->sortByDesc('total_cost')
            ->values()
            ->all();
    }

    /**
     * @param  Collection<int, WorkOrder>  $completed
     * @return list<array{category_id: int|null, name: string, color: string|null, work_order_count: int, total_cost: float}>
     */
    private function byCategory(Collection $completed): array
    {
        return $completed
            ->groupBy('category_id')
            ->map(function (Collection $rows, $categoryId): array {
                /** @var WorkOrder $first */
                $first = $rows->first();
                $total = (float) $rows->sum(fn (WorkOrder $wo): float => $this->workOrderCost($wo));

                return [
                    'category_id' => $categoryId ? (int) $categoryId : null,
                    'name' => $first->category?->name ?? '—',
                    'color' => $first->category?->color,
                    'work_order_count' => $rows->count(),
                    'total_cost' => round($total, 2),
                ];
            })
            ->sortByDesc('total_cost')
            ->values()
            ->all();
    }

    /**
     * @param  Collection<int, WorkOrder>  $completed
     * @return list<array{vendor_key: string, name: string, partner_id: int|null, work_order_count: int, total_cost: float}>
     */
    private function byVendor(Collection $completed): array
    {
        return $completed
            ->filter(fn (WorkOrder $wo): bool => filled($wo->vendor_partner_id) || filled($wo->vendor_name))
            ->groupBy(function (WorkOrder $wo): string {
                if ($wo->vendor_partner_id) {
                    return 'partner:'.$wo->vendor_partner_id;
                }

                return 'name:'.mb_strtolower(trim((string) $wo->vendor_name));
            })
            ->map(function (Collection $rows, string $key): array {
                /** @var WorkOrder $first */
                $first = $rows->first();
                $total = (float) $rows->sum(fn (WorkOrder $wo): float => $this->workOrderCost($wo));

                return [
                    'vendor_key' => $key,
                    'name' => $first->vendorPartner?->name ?? $first->vendor_name ?? '—',
                    'partner_id' => $first->vendor_partner_id,
                    'work_order_count' => $rows->count(),
                    'total_cost' => round($total, 2),
                ];
            })
            ->sortByDesc('total_cost')
            ->values()
            ->all();
    }

    /**
     * @param  Collection<int, WorkOrder>  $completed
     * @return array{avg_hours: float|null, total_hours: float, sample_count: int}
     */
    private function downtime(Collection $completed): array
    {
        $withTiming = $completed->filter(
            fn (WorkOrder $wo): bool => $wo->started_at !== null && $wo->completed_at !== null,
        );

        if ($withTiming->isEmpty()) {
            return [
                'avg_hours' => null,
                'total_hours' => 0.0,
                'sample_count' => 0,
            ];
        }

        $total = $this->sumDowntimeHours($withTiming);

        return [
            'avg_hours' => round($total / $withTiming->count(), 2),
            'total_hours' => round($total, 2),
            'sample_count' => $withTiming->count(),
        ];
    }

    /**
     * Preventive WOs completed on or before their scheduled date.
     *
     * @return array{pct: float|null, on_time: int, total: int}
     */
    private function compliance(Carbon $from, Carbon $to): array
    {
        $preventive = WorkOrder::query()
            ->where('status', WorkOrder::STATUS_COMPLETED)
            ->where('type', WorkOrder::TYPE_PREVENTIVE)
            ->whereNotNull('completed_at')
            ->whereNotNull('scheduled_date')
            ->whereBetween('completed_at', [$from, $to])
            ->get(['id', 'scheduled_date', 'completed_at']);

        if ($preventive->isEmpty()) {
            return [
                'pct' => null,
                'on_time' => 0,
                'total' => 0,
            ];
        }

        $onTime = $preventive->filter(
            fn (WorkOrder $wo): bool => $wo->completed_at !== null
                && $wo->scheduled_date !== null
                && $wo->completed_at->toDateString() <= $wo->scheduled_date->toDateString(),
        )->count();

        return [
            'pct' => round(($onTime / $preventive->count()) * 100, 1),
            'on_time' => $onTime,
            'total' => $preventive->count(),
        ];
    }

    /**
     * Last 12 calendar months of completed WO spend.
     *
     * @return list<array{month: string, label: string, cost: float, work_order_count: int}>
     */
    private function monthlyCosts(): array
    {
        $start = now()->startOfMonth()->subMonths(11);

        $grouped = WorkOrder::query()
            ->where('status', WorkOrder::STATUS_COMPLETED)
            ->whereNotNull('completed_at')
            ->where('completed_at', '>=', $start)
            ->get(['completed_at', 'actual_labor_cost', 'actual_parts_cost'])
            ->groupBy(fn (WorkOrder $wo): string => $wo->completed_at->format('Y-m'));

        $months = [];
        for ($i = 0; $i < 12; $i++) {
            $month = $start->copy()->addMonths($i);
            $key = $month->format('Y-m');
            /** @var Collection<int, WorkOrder> $rows */
            $rows = $grouped->get($key, collect());

            $months[] = [
                'month' => $key,
                'label' => $month->translatedFormat('M Y'),
                'cost' => round((float) $rows->sum(fn (WorkOrder $wo): float => $this->workOrderCost($wo)), 2),
                'work_order_count' => $rows->count(),
            ];
        }

        return $months;
    }

    /**
     * Cost totals by vehicle for external modules (e.g. Transportation reports).
     *
     * @return Collection<int, WorkOrder>
     */
    public function costByVehicle(Carbon $from, Carbon $to): Collection
    {
        return WorkOrder::query()
            ->with('vehicle:id,name,plate_number')
            ->where('status', WorkOrder::STATUS_COMPLETED)
            ->whereNotNull('completed_at')
            ->whereBetween('completed_at', [$from, $to])
            ->selectRaw('vehicle_id')
            ->selectRaw('coalesce(sum(coalesce(actual_labor_cost, 0) + coalesce(actual_parts_cost, 0)), 0) as total_cost')
            ->selectRaw('count(*) as log_count')
            ->groupBy('vehicle_id')
            ->orderByDesc('total_cost')
            ->get();
    }

    private function workOrderCost(WorkOrder $workOrder): float
    {
        return (float) ($workOrder->actual_labor_cost ?? 0) + (float) ($workOrder->actual_parts_cost ?? 0);
    }

    /**
     * @param  Collection<int, WorkOrder>  $rows
     */
    private function sumDowntimeHours(Collection $rows): float
    {
        return (float) $rows->sum(function (WorkOrder $wo): float {
            if ($wo->started_at === null || $wo->completed_at === null) {
                return 0.0;
            }

            return max(0, $wo->started_at->diffInMinutes($wo->completed_at) / 60);
        });
    }
}
