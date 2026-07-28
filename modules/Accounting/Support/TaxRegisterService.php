<?php

namespace Modules\Accounting\Support;

use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Schema;
use Modules\Invoicing\Models\Invoice;
use Modules\Payables\Models\SupplierBill;

/**
 * Manual PPN tax register (faktur keluaran / masukan) for CSV / screen review.
 * Not a DJP e-Faktur exporter — document compliance MVP only.
 */
class TaxRegisterService
{
    public const SIDE_OUTPUT = 'output';

    public const SIDE_INPUT = 'input';

    /**
     * @return array{
     *     side: string,
     *     from: string,
     *     to: string,
     *     rows: list<array<string, mixed>>,
     *     totals: array{dpp: float, tax: float, gross: float}
     * }
     */
    public function report(string $side, Carbon $from, Carbon $to): array
    {
        $rows = $side === self::SIDE_INPUT
            ? $this->inputRows($from, $to)
            : $this->outputRows($from, $to);

        return [
            'side' => $side === self::SIDE_INPUT ? self::SIDE_INPUT : self::SIDE_OUTPUT,
            'from' => $from->toDateString(),
            'to' => $to->toDateString(),
            'rows' => $rows->values()->all(),
            'totals' => [
                'dpp' => round((float) $rows->sum('dpp'), 2),
                'tax' => round((float) $rows->sum('tax'), 2),
                'gross' => round((float) $rows->sum('gross'), 2),
            ],
        ];
    }

    /**
     * @return Collection<int, array<string, mixed>>
     */
    private function outputRows(Carbon $from, Carbon $to): Collection
    {
        if (! Schema::hasTable('invoices')) {
            return collect();
        }

        return Invoice::query()
            ->with('partner:id,code,name,tax_id')
            ->whereIn('status', [
                Invoice::STATUS_ISSUED,
                Invoice::STATUS_PARTIALLY_PAID,
                Invoice::STATUS_PAID,
            ])
            ->whereBetween('issue_date', [$from->toDateString(), $to->toDateString()])
            ->orderBy('issue_date')
            ->orderBy('code')
            ->get()
            ->map(fn (Invoice $invoice): array => [
                'date' => $invoice->issue_date?->toDateString(),
                'document' => $invoice->code,
                'partner_code' => $invoice->partner?->code,
                'partner_name' => $invoice->partner?->name,
                'npwp' => $invoice->partner?->tax_id,
                'tax_code' => $invoice->tax_code,
                'tax_rate' => (float) $invoice->tax_rate,
                'dpp' => (float) $invoice->subtotal,
                'tax' => (float) $invoice->tax_amount,
                'gross' => (float) $invoice->total,
                'kind' => $invoice->isCreditNote() ? 'credit_note' : 'invoice',
            ]);
    }

    /**
     * @return Collection<int, array<string, mixed>>
     */
    private function inputRows(Carbon $from, Carbon $to): Collection
    {
        if (! Schema::hasTable('supplier_bills')) {
            return collect();
        }

        return SupplierBill::query()
            ->with('partner:id,code,name,tax_id')
            ->whereIn('status', [
                SupplierBill::STATUS_ISSUED,
                SupplierBill::STATUS_PARTIALLY_PAID,
                SupplierBill::STATUS_PAID,
            ])
            ->whereBetween('bill_date', [$from->toDateString(), $to->toDateString()])
            ->orderBy('bill_date')
            ->orderBy('code')
            ->get()
            ->map(fn (SupplierBill $bill): array => [
                'date' => $bill->bill_date?->toDateString(),
                'document' => $bill->code,
                'partner_code' => $bill->partner?->code,
                'partner_name' => $bill->partner?->name,
                'npwp' => $bill->partner?->tax_id,
                'tax_code' => $bill->tax_code,
                'tax_rate' => (float) $bill->tax_rate,
                'dpp' => (float) $bill->subtotal,
                'tax' => (float) $bill->tax_amount,
                'gross' => (float) $bill->total,
                'kind' => $bill->isCreditNote() ? 'credit_note' : 'bill',
            ]);
    }
}
