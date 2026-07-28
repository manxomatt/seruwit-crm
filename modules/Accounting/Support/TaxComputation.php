<?php

namespace Modules\Accounting\Support;

use Modules\Accounting\Models\TaxCode;

/**
 * Shared PPN math for invoices, bills, and POS.
 *
 * Exclusive: line totals are net; tax is added on top.
 * Inclusive: line totals are gross; tax is backed out of the total.
 */
class TaxComputation
{
    /**
     * @param  array{enabled?: bool, rate?: float, calculation?: string}|TaxCode|null  $tax
     * @return array{net: float, tax: float, gross: float, enabled: bool, rate: float, calculation: string}
     */
    public static function fromLineTotal(float $lineTotal, array|TaxCode|null $tax): array
    {
        $enabled = true;
        $rate = 0.0;
        $calculation = TaxCode::CALC_EXCLUSIVE;

        if ($tax instanceof TaxCode) {
            $enabled = $tax->isTaxable();
            $rate = (float) $tax->rate;
            $calculation = $tax->calculation === TaxCode::CALC_NONE
                ? TaxCode::CALC_EXCLUSIVE
                : (string) $tax->calculation;
        } elseif (is_array($tax)) {
            $enabled = (bool) ($tax['enabled'] ?? false);
            $rate = (float) ($tax['rate'] ?? 0);
            $calculation = (string) ($tax['calculation'] ?? TaxCode::CALC_EXCLUSIVE);
        } else {
            $enabled = false;
        }

        $lineTotal = round($lineTotal, 2);

        if (! $enabled || $rate <= 0) {
            return [
                'net' => $lineTotal,
                'tax' => 0.0,
                'gross' => $lineTotal,
                'enabled' => false,
                'rate' => 0.0,
                'calculation' => TaxCode::CALC_NONE,
            ];
        }

        if ($calculation === TaxCode::CALC_INCLUSIVE) {
            $gross = $lineTotal;
            $net = round($gross / (1 + ($rate / 100)), 2);
            $taxAmount = round($gross - $net, 2);

            return [
                'net' => $net,
                'tax' => $taxAmount,
                'gross' => $gross,
                'enabled' => true,
                'rate' => $rate,
                'calculation' => TaxCode::CALC_INCLUSIVE,
            ];
        }

        $net = $lineTotal;
        $taxAmount = round($net * ($rate / 100), 2);

        return [
            'net' => $net,
            'tax' => $taxAmount,
            'gross' => round($net + $taxAmount, 2),
            'enabled' => true,
            'rate' => $rate,
            'calculation' => TaxCode::CALC_EXCLUSIVE,
        ];
    }
}
