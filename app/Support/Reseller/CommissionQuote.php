<?php

namespace App\Support\Reseller;

use App\Models\ResellerCommissionRule;

/**
 * The outcome of resolving what a single payment owes a reseller.
 *
 * Everything needed to write a ledger row, already resolved — the accrual step
 * does no arithmetic of its own.
 */
class CommissionQuote
{
    public function __construct(
        public readonly string $resellerGlobalId,
        public readonly string $event,
        public readonly int $occurrence,
        public readonly float $baseAmount,
        public readonly string $rateType,
        public readonly float $rateValue,
        public readonly float $commissionAmount,
        public readonly ?ResellerCommissionRule $rule = null,
    ) {}
}
