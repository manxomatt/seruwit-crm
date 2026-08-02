<?php

namespace Modules\Partners\Support;

use Modules\Partners\Models\Location;
use Modules\Partners\Models\Partner;

/**
 * Partners overview: role/status mix, location readiness, and recent activity.
 */
class PartnerStatusBoard
{
    /**
     * @return array<string, mixed>
     */
    public function build(int $recentLimit = 10): array
    {
        $byStatus = Partner::query()
            ->selectRaw('status, count(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status');

        $byAccountType = Partner::query()
            ->selectRaw('account_type, count(*) as total')
            ->groupBy('account_type')
            ->pluck('total', 'account_type');

        $customers = (int) Partner::query()->where('customer_rank', '>', 0)->count();
        $suppliers = (int) Partner::query()->where('supplier_rank', '>', 0)->count();
        $both = (int) Partner::query()
            ->where('customer_rank', '>', 0)
            ->where('supplier_rank', '>', 0)
            ->count();
        $blacklisted = (int) Partner::query()->where('is_blacklisted', true)->count();
        $missingContact = (int) Partner::query()
            ->where(function ($query): void {
                $query->whereNull('email')->orWhere('email', '');
            })
            ->where(function ($query): void {
                $query->whereNull('phone')->orWhere('phone', '');
            })
            ->where(function ($query): void {
                $query->whereNull('mobile')->orWhere('mobile', '');
            })
            ->count();

        $locationsActive = (int) Location::query()->where('is_active', true)->count();
        $locationsTotal = (int) Location::query()->count();

        $recent = Partner::query()
            ->with('industry:id,name')
            ->latest()
            ->limit($recentLimit)
            ->get(['id', 'code', 'name', 'account_type', 'customer_rank', 'supplier_rank', 'status', 'industry_id', 'created_at'])
            ->map(fn (Partner $partner): array => [
                'id' => $partner->id,
                'code' => $partner->code,
                'name' => $partner->name,
                'account_type' => $partner->account_type,
                'customer_rank' => (int) $partner->customer_rank,
                'supplier_rank' => (int) $partner->supplier_rank,
                'status' => $partner->status,
                'industry' => $partner->industry?->label,
                'created_at' => $partner->created_at?->toDateString(),
            ])
            ->all();

        $industryTotals = Partner::query()
            ->join('partner_industries', 'partners.industry_id', '=', 'partner_industries.id')
            ->selectRaw('partner_industries.id as id, count(*) as total')
            ->groupBy('partner_industries.id')
            ->orderByDesc('total')
            ->limit(5)
            ->get();

        $industryModels = \Modules\Partners\Models\PartnerIndustry::query()
            ->whereIn('id', $industryTotals->pluck('id'))
            ->get()
            ->keyBy('id');

        $byIndustry = $industryTotals
            ->map(fn ($row): array => [
                'id' => (int) $row->id,
                'name' => $industryModels->get((int) $row->id)?->label ?? '',
                'total' => (int) $row->total,
            ])
            ->all();

        $total = (int) $byStatus->sum();

        return [
            'counts' => [
                'total' => $total,
                'active' => (int) ($byStatus['active'] ?? 0),
                'inactive' => (int) ($byStatus['inactive'] ?? 0),
                'customers' => $customers,
                'suppliers' => $suppliers,
                'both' => $both,
                'companies' => (int) ($byAccountType['company'] ?? 0),
                'individuals' => (int) ($byAccountType['individual'] ?? 0),
                'blacklisted' => $blacklisted,
                'missing_contact' => $missingContact,
            ],
            'locations' => [
                'active' => $locationsActive,
                'inactive' => max(0, $locationsTotal - $locationsActive),
                'total' => $locationsTotal,
            ],
            'recent' => $recent,
            'by_industry' => $byIndustry,
        ];
    }
}
