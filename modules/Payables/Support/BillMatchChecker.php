<?php

namespace Modules\Payables\Support;

use App\Models\Setting;
use Modules\Payables\Models\SupplierBill;
use Modules\Payables\Models\SupplierBillLine;

class BillMatchChecker
{
    public static function toleranceAmount(): float
    {
        return max(0, round((float) Setting::getValue('payables.match_tolerance_amount', '0'), 2));
    }

    public static function tolerancePercent(): float
    {
        return max(0, round((float) Setting::getValue('payables.match_tolerance_percent', '0'), 4));
    }

    public static function allowedVariance(float $expectedAmount): float
    {
        $byAmount = self::toleranceAmount();
        $byPercent = round(abs($expectedAmount) * self::tolerancePercent() / 100, 2);

        return max($byAmount, $byPercent);
    }

    public static function variance(SupplierBillLine $line): float
    {
        $expected = $line->expected_amount;
        if ($expected === null) {
            return 0.0;
        }

        return round((float) $line->amount - (float) $expected, 2);
    }

    public static function lineExceedsTolerance(SupplierBillLine $line): bool
    {
        if ($line->expected_amount === null) {
            return false;
        }

        $allowed = self::allowedVariance((float) $line->expected_amount);

        return abs(self::variance($line)) > ($allowed + 0.009);
    }

    public static function billExceedsTolerance(SupplierBill $bill): bool
    {
        $bill->loadMissing('lines');

        return $bill->lines->contains(
            fn (SupplierBillLine $line): bool => self::lineExceedsTolerance($line)
        );
    }

    /**
     * @return array{tolerance_amount: float, tolerance_percent: float, has_variance: bool, exceeds_tolerance: bool}
     */
    public static function snapshot(SupplierBill $bill): array
    {
        $bill->loadMissing('lines');

        $hasVariance = $bill->lines->contains(function (SupplierBillLine $line): bool {
            return $line->expected_amount !== null && abs(self::variance($line)) > 0.009;
        });

        return [
            'tolerance_amount' => self::toleranceAmount(),
            'tolerance_percent' => self::tolerancePercent(),
            'has_variance' => $hasVariance,
            'exceeds_tolerance' => self::billExceedsTolerance($bill),
        ];
    }
}
