<?php

namespace Modules\TradePromotions\Support;

use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Modules\TradePromotions\Models\PromoApplication;
use Modules\TradePromotions\Models\TradePromoAward;
use Modules\TradePromotions\Models\TradePromoProgram;

class PromoReportService
{
    /**
     * @param  array{
     *     from?: string|null,
     *     to?: string|null,
     *     warehouse_id?: int|null,
     *     program_id?: int|null
     * }  $filters
     * @return array{
     *     checkout_by_channel: list<array{channel: string, applications: int, discount_total: float}>,
     *     checkout_by_site: list<array{warehouse_id: int|null, warehouse_name: string, applications: int, discount_total: float}>,
     *     trade_awards: array{accrued: float, settled: float, accrued_count: int, settled_count: int},
     *     settlements_by_type: list<array{settlement_type: string, count: int, amount: float}>
     * }
     */
    public function summarize(array $filters = []): array
    {
        $from = $filters['from'] ?? null;
        $to = $filters['to'] ?? null;
        $warehouseId = isset($filters['warehouse_id']) ? (int) $filters['warehouse_id'] : null;
        $programId = isset($filters['program_id']) ? (int) $filters['program_id'] : null;

        return [
            'checkout_by_channel' => $this->checkoutByChannel($from, $to, $warehouseId, $programId),
            'checkout_by_site' => $this->checkoutBySite($from, $to, $warehouseId, $programId),
            'trade_awards' => $this->tradeAwardTotals($from, $to, $programId),
            'settlements_by_type' => $this->settlementsByType($from, $to, $programId),
        ];
    }

    /**
     * @return list<array{channel: string, applications: int, discount_total: float}>
     */
    protected function checkoutByChannel(?string $from, ?string $to, ?int $warehouseId, ?int $programId): array
    {
        if (! Schema::hasTable('promo_applications')) {
            return [];
        }

        $rows = PromoApplication::query()
            ->selectRaw('source_type, count(*) as applications, sum(discount_amount) as discount_total')
            ->when($programId, fn ($q) => $q->where('trade_promo_program_id', $programId))
            ->when($from, fn ($q) => $q->whereDate('created_at', '>=', $from))
            ->when($to, fn ($q) => $q->whereDate('created_at', '<=', $to))
            ->when($warehouseId, fn ($q) => $this->constrainApplicationsToWarehouse($q, $warehouseId))
            ->groupBy('source_type')
            ->orderBy('source_type')
            ->get();

        return $rows->map(fn ($row): array => [
            'channel' => $this->channelLabel((string) $row->source_type),
            'applications' => (int) $row->applications,
            'discount_total' => round((float) $row->discount_total, 2),
        ])->values()->all();
    }

    /**
     * @return list<array{warehouse_id: int|null, warehouse_name: string, applications: int, discount_total: float}>
     */
    protected function checkoutBySite(?string $from, ?string $to, ?int $warehouseId, ?int $programId): array
    {
        if (! Schema::hasTable('promo_applications')) {
            return [];
        }

        $byWarehouse = [];

        foreach (['pos_sale' => 'pos_sales', 'sales_order' => 'sales_orders'] as $sourceType => $table) {
            if (! Schema::hasTable($table) || ! Schema::hasColumn($table, 'warehouse_id')) {
                continue;
            }

            $query = DB::table('promo_applications')
                ->join($table, $table.'.id', '=', 'promo_applications.source_id')
                ->where('promo_applications.source_type', $sourceType)
                ->when($programId, fn ($q) => $q->where('promo_applications.trade_promo_program_id', $programId))
                ->when($from, fn ($q) => $q->whereDate('promo_applications.created_at', '>=', $from))
                ->when($to, fn ($q) => $q->whereDate('promo_applications.created_at', '<=', $to))
                ->when($warehouseId, fn ($q) => $q->where($table.'.warehouse_id', $warehouseId))
                ->groupBy($table.'.warehouse_id')
                ->selectRaw($table.'.warehouse_id as warehouse_id, count(*) as applications, sum(promo_applications.discount_amount) as discount_total');

            foreach ($query->get() as $row) {
                $id = $row->warehouse_id !== null ? (int) $row->warehouse_id : 0;
                if (! isset($byWarehouse[$id])) {
                    $byWarehouse[$id] = [
                        'warehouse_id' => $row->warehouse_id !== null ? (int) $row->warehouse_id : null,
                        'applications' => 0,
                        'discount_total' => 0.0,
                    ];
                }
                $byWarehouse[$id]['applications'] += (int) $row->applications;
                $byWarehouse[$id]['discount_total'] += (float) $row->discount_total;
            }
        }

        $names = [];
        if ($byWarehouse !== [] && Schema::hasTable('warehouses')) {
            $ids = collect($byWarehouse)->pluck('warehouse_id')->filter()->all();
            if ($ids !== []) {
                $names = DB::table('warehouses')->whereIn('id', $ids)->pluck('name', 'id')->all();
            }
        }

        return collect($byWarehouse)
            ->map(function (array $row) use ($names): array {
                $row['discount_total'] = round($row['discount_total'], 2);
                $row['warehouse_name'] = $row['warehouse_id']
                    ? (string) ($names[$row['warehouse_id']] ?? ('#'.$row['warehouse_id']))
                    : __('promotions.reports.unknown_site');

                return $row;
            })
            ->sortByDesc('discount_total')
            ->values()
            ->all();
    }

    /**
     * @return array{accrued: float, settled: float, accrued_count: int, settled_count: int}
     */
    protected function tradeAwardTotals(?string $from, ?string $to, ?int $programId): array
    {
        $base = TradePromoAward::query()
            ->when($programId, fn ($q) => $q->where('trade_promo_program_id', $programId))
            ->when($from, fn ($q) => $q->whereDate('created_at', '>=', $from))
            ->when($to, fn ($q) => $q->whereDate('created_at', '<=', $to));

        $accrued = (clone $base)->where('status', TradePromoAward::STATUS_ACCRUED);
        $settled = (clone $base)->where('status', TradePromoAward::STATUS_SETTLED);

        return [
            'accrued' => round((float) $accrued->sum('amount'), 2),
            'settled' => round((float) $settled->sum('amount'), 2),
            'accrued_count' => (int) $accrued->count(),
            'settled_count' => (int) $settled->count(),
        ];
    }

    /**
     * @return list<array{settlement_type: string, count: int, amount: float}>
     */
    protected function settlementsByType(?string $from, ?string $to, ?int $programId): array
    {
        if (! Schema::hasColumn('trade_promo_awards', 'settlement_type')) {
            return [];
        }

        return TradePromoAward::query()
            ->where('status', TradePromoAward::STATUS_SETTLED)
            ->when($programId, fn ($q) => $q->where('trade_promo_program_id', $programId))
            ->when($from, fn ($q) => $q->whereDate('settled_at', '>=', $from))
            ->when($to, fn ($q) => $q->whereDate('settled_at', '<=', $to))
            ->selectRaw('coalesce(settlement_type, ?) as settlement_type, count(*) as count, sum(coalesce(amount, 0)) as amount', [
                PromoAwardSettlementService::SETTLEMENT_MANUAL,
            ])
            ->groupBy('settlement_type')
            ->orderBy('settlement_type')
            ->get()
            ->map(fn ($row): array => [
                'settlement_type' => (string) $row->settlement_type,
                'count' => (int) $row->count,
                'amount' => round((float) $row->amount, 2),
            ])
            ->all();
    }

    /**
     * @param  \Illuminate\Database\Eloquent\Builder<PromoApplication>  $query
     * @return \Illuminate\Database\Eloquent\Builder<PromoApplication>
     */
    protected function constrainApplicationsToWarehouse($query, int $warehouseId)
    {
        return $query->where(function ($outer) use ($warehouseId): void {
            if (Schema::hasTable('pos_sales')) {
                $outer->orWhere(function ($q) use ($warehouseId): void {
                    $q->where('source_type', 'pos_sale')
                        ->whereIn('source_id', DB::table('pos_sales')->where('warehouse_id', $warehouseId)->select('id'));
                });
            }
            if (Schema::hasTable('sales_orders')) {
                $outer->orWhere(function ($q) use ($warehouseId): void {
                    $q->where('source_type', 'sales_order')
                        ->whereIn('source_id', DB::table('sales_orders')->where('warehouse_id', $warehouseId)->select('id'));
                });
            }
        });
    }

    protected function channelLabel(string $sourceType): string
    {
        return match ($sourceType) {
            'pos_sale' => 'pos',
            'sales_order' => 'sales',
            default => $sourceType,
        };
    }

    /**
     * @return Collection<int, TradePromoProgram>
     */
    public function programOptions(): Collection
    {
        return TradePromoProgram::query()
            ->orderByDesc('id')
            ->get(['id', 'code', 'name', 'mode', 'scope']);
    }
}
