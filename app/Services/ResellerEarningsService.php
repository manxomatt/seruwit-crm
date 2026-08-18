<?php

namespace App\Services;

use App\Models\ResellerCommission;
use App\Models\ResellerPayout;
use App\Models\Tenant;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Config;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Read-side aggregates over the commission ledger.
 *
 * Every method takes the reseller's global id explicitly rather than reading
 * the authenticated user: the same numbers are rendered both in the reseller's
 * own portal and in the admin's view of that reseller, and passing the subject
 * in makes it impossible for one to accidentally answer with the other's data.
 */
class ResellerEarningsService
{
    private function centralConnection(): string
    {
        return Config::get('tenancy.database.central_connection');
    }

    /**
     * @return Builder<ResellerCommission>
     */
    public function ledgerQuery(string $resellerGlobalId): Builder
    {
        return ResellerCommission::on($this->centralConnection())
            ->where('reseller_global_id', $resellerGlobalId);
    }

    /**
     * Headline numbers for a reseller's dashboard.
     *
     * `pending` and `approved` are kept apart because they answer different
     * questions: what is still inside its refund window, and what is genuinely
     * waiting to be paid out.
     *
     * @return array{this_month: float, pending: float, approved: float, paid: float, lifetime: float, tenants: int, active_tenants: int, paying_tenants: int}
     */
    public function summary(string $resellerGlobalId): array
    {
        $sumByStatus = $this->ledgerQuery($resellerGlobalId)
            ->selectRaw('status, COALESCE(SUM(commission_amount), 0) AS total')
            ->groupBy('status')
            ->pluck('total', 'status');

        $thisMonth = (float) $this->ledgerQuery($resellerGlobalId)
            ->live()
            ->where('created_at', '>=', Carbon::now()->startOfMonth())
            ->sum('commission_amount');

        $pending = (float) ($sumByStatus[ResellerCommission::STATUS_PENDING] ?? 0);
        $approved = (float) ($sumByStatus[ResellerCommission::STATUS_APPROVED] ?? 0);
        $paid = (float) ($sumByStatus[ResellerCommission::STATUS_PAID] ?? 0);

        $tenants = Tenant::on($this->centralConnection())
            ->where('reseller_global_id', $resellerGlobalId);

        return [
            'this_month' => $thisMonth,
            'pending' => $pending,
            'approved' => $approved,
            'paid' => $paid,
            'lifetime' => $pending + $approved + $paid,
            'tenants' => (clone $tenants)->count(),
            'active_tenants' => (clone $tenants)->where('status', 'active')->count(),
            'paying_tenants' => $this->ledgerQuery($resellerGlobalId)->live()->distinct()->count('tenant_id'),
        ];
    }

    /**
     * Commission earned per month, oldest first, with empty months filled in so
     * a chart never has to guess at gaps.
     *
     * @return list<array{month: string, label: string, total: float}>
     */
    public function monthlySeries(string $resellerGlobalId, int $months = 6): array
    {
        $start = Carbon::now()->startOfMonth()->subMonths($months - 1);

        $totals = $this->ledgerQuery($resellerGlobalId)
            ->live()
            ->where('created_at', '>=', $start)
            ->selectRaw("to_char(created_at, 'YYYY-MM') AS bucket, COALESCE(SUM(commission_amount), 0) AS total")
            ->groupBy('bucket')
            ->pluck('total', 'bucket');

        return collect(range(0, $months - 1))
            ->map(function (int $offset) use ($start, $totals): array {
                $month = $start->copy()->addMonths($offset);
                $key = $month->format('Y-m');

                return [
                    'month' => $key,
                    'label' => $month->format('M Y'),
                    'total' => (float) ($totals[$key] ?? 0),
                ];
            })
            ->all();
    }

    /**
     * Stream a commission query out as CSV.
     *
     * Streamed and chunked rather than collected: a reseller with a few years
     * of history should not have to fit their whole ledger in memory to
     * download it.
     *
     * @param  Builder<ResellerCommission>  $query
     */
    public function csvResponse(Builder $query, string $filename): StreamedResponse
    {
        $columns = [
            'date', 'reseller', 'tenant', 'plan', 'event', 'occurrence',
            'base_amount', 'rate_type', 'rate_value', 'commission_amount',
            'tax_withheld', 'net_amount', 'currency', 'status', 'hold_until', 'paid_at',
        ];

        return response()->streamDownload(function () use ($query, $columns): void {
            $handle = fopen('php://output', 'wb');
            fputcsv($handle, $columns);

            $query->with(['tenant', 'plan:id,name', 'reseller:global_id,name'])
                ->orderBy('id')
                ->chunk(500, function ($commissions) use ($handle): void {
                    foreach ($commissions as $commission) {
                        fputcsv($handle, [
                            $commission->created_at?->toDateString(),
                            $commission->reseller?->name,
                            $commission->tenant?->name ?? $commission->tenant_id,
                            $commission->plan?->name,
                            $commission->event,
                            $commission->occurrence,
                            $commission->base_amount,
                            $commission->rate_type,
                            $commission->rate_value,
                            $commission->commission_amount,
                            $commission->tax_withheld_amount,
                            $commission->net_amount,
                            $commission->currency,
                            $commission->status,
                            $commission->hold_until?->toDateString(),
                            $commission->paid_at?->toDateString(),
                        ]);
                    }
                });

            fclose($handle);
        }, $filename, ['Content-Type' => 'text/csv']);
    }

    /**
     * Shape one payout batch for the UI.
     *
     * @return array<string, mixed>
     */
    public function presentPayout(ResellerPayout $payout): array
    {
        return [
            'id' => $payout->id,
            'reference' => $payout->reference,
            'reseller_global_id' => $payout->reseller_global_id,
            'reseller_name' => $payout->reseller?->name,
            'period_start' => $payout->period_start?->toDateString(),
            'period_end' => $payout->period_end?->toDateString(),
            'gross_amount' => (float) $payout->gross_amount,
            'tax_withheld_amount' => (float) $payout->tax_withheld_amount,
            'net_amount' => (float) $payout->net_amount,
            'currency' => $payout->currency,
            'status' => $payout->status,
            'bank_name' => $payout->bank_name,
            'account_number' => $payout->account_number,
            'account_name' => $payout->account_name,
            'proof_url' => $payout->proof_url,
            'approved_at' => $payout->approved_at?->toDateString(),
            'paid_at' => $payout->paid_at?->toDateString(),
            'notes' => $payout->notes,
            'created_at' => $payout->created_at?->toDateString(),
        ];
    }

    /**
     * Shape one ledger row for the UI.
     *
     * @return array<string, mixed>
     */
    public function presentCommission(ResellerCommission $commission): array
    {
        return [
            'id' => $commission->id,
            'tenant_id' => $commission->tenant_id,
            'tenant_name' => $commission->tenant?->name,
            'plan_name' => $commission->plan?->name,
            'event' => $commission->event,
            'occurrence' => $commission->occurrence,
            'base_amount' => (float) $commission->base_amount,
            'rate_type' => $commission->rate_type,
            'rate_value' => (float) $commission->rate_value,
            'commission_amount' => (float) $commission->commission_amount,
            'net_amount' => (float) $commission->net_amount,
            'currency' => $commission->currency,
            'status' => $commission->status,
            'hold_until' => $commission->hold_until?->toDateString(),
            'paid_at' => $commission->paid_at?->toDateString(),
            'void_reason' => $commission->void_reason,
            'created_at' => $commission->created_at?->toDateString(),
        ];
    }
}
