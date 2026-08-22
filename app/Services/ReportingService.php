<?php

namespace App\Services;

use App\Models\PaymentOrder;
use App\Models\PriceHistory;
use App\Models\Subscription;
use App\Models\SubscriptionBillingReport;
use App\Models\SubscriptionTier;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class ReportingService
{
    /**
     * Generate billing report for subscription
     */
    public function generateBillingReport(Subscription $subscription, PaymentOrder $paymentOrder): SubscriptionBillingReport
    {
        return DB::connection(config('tenancy.database.central_connection'))
            ->transaction(function () use ($subscription, $paymentOrder) {
                $billingDate = now();

                return SubscriptionBillingReport::create([
                    'subscription_id' => $subscription->id,
                    'payment_order_id' => $paymentOrder->id,
                    'year' => $billingDate->year,
                    'month' => $billingDate->month,
                    'total_amount' => $paymentOrder->total_amount,
                    'vehicle_cost' => $paymentOrder->total_vehicle_cost ?? 0,
                    'vehicle_count' => $subscription->subscribed_vehicles,
                    'billing_interval' => $paymentOrder->billing_interval,
                    'status' => 'billed',
                    'billed_at' => $billingDate,
                ]);
            });
    }

    /**
     * Track price change for a tier
     */
    public function recordPriceChange(
        SubscriptionTier $tier,
        int $newPrice,
        ?string $changeReason = null,
        ?Carbon $effectiveDate = null
    ): PriceHistory {
        $oldPrice = $tier->price_per_vehicle;

        return PriceHistory::create([
            'subscription_tier_id' => $tier->id,
            'old_price_per_vehicle' => $oldPrice,
            'new_price_per_vehicle' => $newPrice,
            'change_reason' => $changeReason,
            'effective_date' => $effectiveDate ?? now(),
        ]);
    }

    /**
     * Get billing reports for subscription
     */
    public function getBillingReports(Subscription $subscription, int $limit = 24): \Illuminate\Database\Eloquent\Collection
    {
        return SubscriptionBillingReport::where('subscription_id', $subscription->id)
            ->orderBy('year', 'desc')
            ->orderBy('month', 'desc')
            ->limit($limit)
            ->get();
    }

    /**
     * Get billing report for specific month/year
     */
    public function getBillingReport(Subscription $subscription, int $year, int $month): ?SubscriptionBillingReport
    {
        return SubscriptionBillingReport::where('subscription_id', $subscription->id)
            ->where('year', $year)
            ->where('month', $month)
            ->first();
    }

    /**
     * Get price history for tier
     */
    public function getPriceHistory(SubscriptionTier $tier, int $limit = 12): \Illuminate\Database\Eloquent\Collection
    {
        return PriceHistory::where('subscription_tier_id', $tier->id)
            ->latest('effective_date')
            ->limit($limit)
            ->get();
    }

    /**
     * Calculate total spent in period
     */
    public function getTotalSpentInPeriod(
        Subscription $subscription,
        ?Carbon $startDate = null,
        ?Carbon $endDate = null
    ): int {
        $query = SubscriptionBillingReport::where('subscription_id', $subscription->id)
            ->where('status', 'paid');

        if ($startDate) {
            $query->where('billed_at', '>=', $startDate);
        }

        if ($endDate) {
            $query->where('billed_at', '<=', $endDate);
        }

        return (int) $query->sum('total_amount');
    }

    /**
     * Get billing summary by status
     */
    public function getBillingSummary(Subscription $subscription): array
    {
        $reports = SubscriptionBillingReport::where('subscription_id', $subscription->id)
            ->get()
            ->groupBy('status');

        return [
            'pending' => $reports->get('pending', collect())->count(),
            'billed' => $reports->get('billed', collect())->count(),
            'paid' => $reports->get('paid', collect())->count(),
            'total_pending_amount' => (int) ($reports->get('pending', collect())->sum('total_amount') ?? 0),
            'total_billed_amount' => (int) ($reports->get('billed', collect())->sum('total_amount') ?? 0),
            'total_paid_amount' => (int) ($reports->get('paid', collect())->sum('total_amount') ?? 0),
        ];
    }

    /**
     * Mark billing report as paid
     */
    public function markBillingReportAsPaid(SubscriptionBillingReport $report): void
    {
        $report->markAsPaid();
    }

    /**
     * Export billing reports to array (for CSV/PDF)
     */
    public function exportBillingReports(
        Subscription $subscription,
        ?Carbon $startDate = null,
        ?Carbon $endDate = null
    ): array {
        $query = SubscriptionBillingReport::where('subscription_id', $subscription->id)
            ->orderBy('year', 'desc')
            ->orderBy('month', 'desc');

        if ($startDate) {
            $query->where('billed_at', '>=', $startDate);
        }

        if ($endDate) {
            $query->where('billed_at', '<=', $endDate);
        }

        return $query->get()->map(fn ($report) => [
            'month_year' => $report->month_year,
            'total_amount' => number_format($report->total_amount / 1000, 2).'k',
            'vehicle_count' => $report->vehicle_count,
            'billing_interval' => $report->billing_interval,
            'status' => strtoupper($report->status),
            'billed_date' => $report->billed_at?->format('Y-m-d'),
            'paid_date' => $report->paid_at?->format('Y-m-d'),
        ])->toArray();
    }

    /**
     * Get average monthly spend
     */
    public function getAverageMonthlySpend(Subscription $subscription): float
    {
        $reports = SubscriptionBillingReport::where('subscription_id', $subscription->id)
            ->where('status', 'paid')
            ->get();

        if ($reports->isEmpty()) {
            return 0;
        }

        $totalAmount = $reports->sum('total_amount');
        $monthCount = $reports->count();

        return $totalAmount / $monthCount;
    }

    /**
     * Get price history for last N days
     */
    public function getRecentPriceChanges(int $days = 30): \Illuminate\Database\Eloquent\Collection
    {
        return PriceHistory::where('effective_date', '>=', now()->subDays($days))
            ->latest('effective_date')
            ->get();
    }
}
