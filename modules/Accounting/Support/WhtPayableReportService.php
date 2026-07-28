<?php

namespace Modules\Accounting\Support;

use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Schema;
use Modules\Payables\Models\BillPayment;

/**
 * Lists PPh withheld on AP bill payments (Hutang PPh) for remittance tracking.
 */
class WhtPayableReportService
{
    /**
     * @return array{
     *     from: string,
     *     to: string,
     *     rows: list<array<string, mixed>>,
     *     totals: array{base: float, wht: float, paid_net: float}
     * }
     */
    public function report(Carbon $from, Carbon $to): array
    {
        if (! Schema::hasTable('bill_payments') || ! Schema::hasColumn('bill_payments', 'wht_amount')) {
            return [
                'from' => $from->toDateString(),
                'to' => $to->toDateString(),
                'rows' => [],
                'totals' => ['base' => 0.0, 'wht' => 0.0, 'paid_net' => 0.0],
            ];
        }

        $rows = BillPayment::query()
            ->with(['partner:id,code,name,tax_id', 'whtTaxCode:id,code,name,rate'])
            ->where('status', '!=', BillPayment::STATUS_VOIDED)
            ->where('wht_amount', '>', 0)
            ->whereBetween('payment_date', [$from->toDateString(), $to->toDateString()])
            ->orderBy('payment_date')
            ->orderBy('code')
            ->get()
            ->map(function (BillPayment $payment): array {
                $wht = (float) $payment->wht_amount;
                $amount = (float) $payment->amount;

                return [
                    'date' => $payment->payment_date?->toDateString(),
                    'document' => $payment->code,
                    'partner_code' => $payment->partner?->code,
                    'partner_name' => $payment->partner?->name,
                    'npwp' => $payment->partner?->tax_id,
                    'wht_code' => $payment->whtTaxCode?->code ?? $payment->wht_tax_code_id,
                    'wht_rate' => (float) ($payment->whtTaxCode?->rate ?? 0),
                    'base' => $amount,
                    'wht' => $wht,
                    'paid_net' => round($amount - $wht, 2),
                    'reference' => $payment->reference_number,
                ];
            });

        return [
            'from' => $from->toDateString(),
            'to' => $to->toDateString(),
            'rows' => $rows->values()->all(),
            'totals' => [
                'base' => round((float) $rows->sum('base'), 2),
                'wht' => round((float) $rows->sum('wht'), 2),
                'paid_net' => round((float) $rows->sum('paid_net'), 2),
            ],
        ];
    }
}
