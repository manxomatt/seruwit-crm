<?php

namespace Modules\Receivables\Support;

use Modules\Invoicing\Models\Invoice;
use Modules\Partners\Models\Partner;

class CreditLimitChecker
{
    /**
     * Outstanding AR for a partner (open invoice balances).
     */
    public static function outstandingFor(Partner|int $partner): float
    {
        $partnerId = $partner instanceof Partner ? $partner->id : $partner;

        return round((float) Invoice::query()
            ->where('partner_id', $partnerId)
            ->whereIn('status', [Invoice::STATUS_ISSUED, Invoice::STATUS_PARTIALLY_PAID])
            ->get(['total', 'amount_paid'])
            ->sum(fn (Invoice $invoice): float => $invoice->balanceDue()), 2);
    }

    /**
     * Whether adding $additional to current outstanding would breach credit_limit.
     * Null/zero credit_limit means unlimited.
     */
    public static function wouldExceed(Partner $partner, float $additional = 0): bool
    {
        $limit = $partner->credit_limit;

        if ($limit === null || (float) $limit <= 0) {
            return false;
        }

        return (self::outstandingFor($partner) + $additional) > ((float) $limit + 0.009);
    }

    /**
     * @return array{limit: float|null, outstanding: float, available: float|null, utilization: float|null, is_over_limit: bool}
     */
    public static function snapshot(Partner $partner): array
    {
        $limit = $partner->credit_limit !== null ? (float) $partner->credit_limit : null;
        $outstanding = self::outstandingFor($partner);
        $available = $limit !== null && $limit > 0 ? max(0, round($limit - $outstanding, 2)) : null;
        $utilization = $limit !== null && $limit > 0
            ? round(($outstanding / $limit) * 100, 1)
            : null;

        return [
            'limit' => $limit,
            'outstanding' => $outstanding,
            'available' => $available,
            'utilization' => $utilization,
            'is_over_limit' => $limit !== null && $limit > 0 && $outstanding > ($limit + 0.009),
        ];
    }
}
