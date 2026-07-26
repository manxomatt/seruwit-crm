<?php

namespace Modules\Receivables\Support;

use Illuminate\Support\Facades\Schema;
use Modules\Invoicing\Models\Invoice;
use Modules\Invoicing\Models\InvoiceLine;
use Modules\Partners\Models\Partner;
use Modules\Sales\Models\GoodsIssueNoteItem;
use Modules\Sales\Models\SalesOrder;

class CreditLimitChecker
{
    /**
     * Outstanding exposure used for limit checks.
     *
     * @param  bool  $includeSalesCommitment  Include uninvoiced open sales orders (SO confirm).
     */
    public static function outstandingFor(
        Partner|int $partner,
        ?int $exceptSalesOrderId = null,
        bool $includeSalesCommitment = true,
    ): float {
        $partnerId = $partner instanceof Partner ? $partner->id : $partner;
        $total = self::arOutstanding($partnerId);

        if ($includeSalesCommitment) {
            $total += self::openSalesCommitment($partnerId, $exceptSalesOrderId);
        }

        return round($total, 2);
    }

    public static function arOutstanding(int $partnerId): float
    {
        if (! Schema::hasTable('invoices')) {
            return 0.0;
        }

        return round((float) Invoice::query()
            ->where('partner_id', $partnerId)
            ->whereIn('status', [Invoice::STATUS_ISSUED, Invoice::STATUS_PARTIALLY_PAID])
            ->get(['total', 'amount_paid'])
            ->sum(fn (Invoice $invoice): float => $invoice->balanceDue()), 2);
    }

    /**
     * Uninvoiced value of open sales orders (confirmed / delivering).
     */
    public static function openSalesCommitment(int $partnerId, ?int $exceptSalesOrderId = null): float
    {
        if (! class_exists(SalesOrder::class) || ! Schema::hasTable('sales_orders')) {
            return 0.0;
        }

        $orders = SalesOrder::query()
            ->where('partner_id', $partnerId)
            ->when($exceptSalesOrderId, fn ($q) => $q->whereKeyNot($exceptSalesOrderId))
            ->whereIn('status', [
                SalesOrder::STATUS_CONFIRMED,
                SalesOrder::STATUS_PARTIAL_DELIVERED,
                SalesOrder::STATUS_FULLY_DELIVERED,
            ])
            ->get(['id', 'total_amount']);

        $commitment = 0.0;

        foreach ($orders as $order) {
            $invoiced = self::invoicedAmountForSalesOrder((int) $order->id);
            $commitment += max(0, round((float) $order->total_amount - $invoiced, 2));
        }

        return round($commitment, 2);
    }

    public static function invoicedAmountForSalesOrder(int $salesOrderId): float
    {
        if (! Schema::hasTable('invoice_lines') || ! Schema::hasTable('goods_issue_note_items')) {
            return 0.0;
        }

        $ginItemIds = GoodsIssueNoteItem::query()
            ->whereHas('goodsIssueNote', fn ($q) => $q->where('sales_order_id', $salesOrderId))
            ->pluck('id');

        if ($ginItemIds->isEmpty()) {
            return 0.0;
        }

        $morph = (new GoodsIssueNoteItem)->getMorphClass();

        return round((float) InvoiceLine::query()
            ->where('source_type', $morph)
            ->whereIn('source_id', $ginItemIds)
            ->whereHas('invoice', fn ($q) => $q->where('status', '!=', Invoice::STATUS_VOID))
            ->where('amount', '>', 0)
            ->sum('amount'), 2);
    }

    /**
     * @param  bool  $includeSalesCommitment  True for SO confirm; false for invoice issue (AR-only gate).
     */
    public static function wouldExceed(
        Partner $partner,
        float $additional = 0,
        ?int $exceptSalesOrderId = null,
        bool $includeSalesCommitment = true,
    ): bool {
        $limit = $partner->credit_limit;

        if ($limit === null || (float) $limit <= 0) {
            return false;
        }

        $outstanding = self::outstandingFor($partner, $exceptSalesOrderId, $includeSalesCommitment);

        return ($outstanding + $additional) > ((float) $limit + 0.009);
    }

    /**
     * @return array{limit: float|null, outstanding: float, ar_outstanding: float, sales_commitment: float, available: float|null, utilization: float|null, is_over_limit: bool}
     */
    public static function snapshot(Partner $partner): array
    {
        $limit = $partner->credit_limit !== null ? (float) $partner->credit_limit : null;
        $ar = self::arOutstanding((int) $partner->id);
        $sales = self::openSalesCommitment((int) $partner->id);
        $outstanding = round($ar + $sales, 2);
        $available = $limit !== null && $limit > 0 ? max(0, round($limit - $outstanding, 2)) : null;
        $utilization = $limit !== null && $limit > 0
            ? round(($outstanding / $limit) * 100, 1)
            : null;

        return [
            'limit' => $limit,
            'outstanding' => $outstanding,
            'ar_outstanding' => $ar,
            'sales_commitment' => $sales,
            'available' => $available,
            'utilization' => $utilization,
            'is_over_limit' => $limit !== null && $limit > 0 && $outstanding > ($limit + 0.009),
        ];
    }
}
