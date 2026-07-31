<?php

namespace Modules\Shuttle\Support;

use Modules\Shuttle\Models\ShuttleBooking;

/**
 * Soft bridge from Shuttle ops to Accounting for walk-in cash sales.
 * Partner bookings continue to post via Invoicing → AccountingBridge::invoiceIssued.
 */
class ShuttleAccountingService
{
    public function accountingAvailable(): bool
    {
        return class_exists(\Modules\Accounting\Support\AccountingBridge::class)
            && \Modules\Accounting\Support\AccountingBridge::available();
    }

    /**
     * Post cash revenue when a walk-in booking is confirmed (no partner / no AR invoice).
     *
     * @param  array{payment_method?: string|null, company_bank_account_id?: int|null}  $options
     */
    public function postWalkInSale(ShuttleBooking $booking, array $options = []): void
    {
        if (! $this->accountingAvailable() || $booking->partner_id !== null) {
            return;
        }

        $split = $this->splitFare((float) $booking->total_fare);

        \Modules\Accounting\Support\AccountingBridge::shuttleSaleCompleted($booking, [
            ...$split,
            'payment_method' => $options['payment_method'] ?? 'cash',
            'company_bank_account_id' => $options['company_bank_account_id'] ?? null,
        ]);
    }

    public function reverseWalkInSale(ShuttleBooking $booking): void
    {
        if (! $this->accountingAvailable() || $booking->partner_id !== null) {
            return;
        }

        \Modules\Accounting\Support\AccountingBridge::shuttleSaleVoided($booking);
    }

    /**
     * @return array{net: float, tax: float, paid: float, tax_code_id: int|null}
     */
    public function splitFare(float $fare): array
    {
        $fare = round($fare, 2);

        if ($fare < 0.005) {
            return ['net' => 0.0, 'tax' => 0.0, 'paid' => 0.0, 'tax_code_id' => null];
        }

        if (! class_exists(\Modules\Accounting\Support\TaxSettings::class)) {
            return ['net' => $fare, 'tax' => 0.0, 'paid' => $fare, 'tax_code_id' => null];
        }

        $snap = \Modules\Accounting\Support\TaxSettings::snapshot();

        if (! $snap['enabled'] || $snap['rate'] <= 0) {
            return [
                'net' => $fare,
                'tax' => 0.0,
                'paid' => $fare,
                'tax_code_id' => $snap['tax_code_id'],
            ];
        }

        $rate = $snap['rate'] / 100;

        // Corridor fares are treated as tax-exclusive (same as invoice line amounts).
        if (($snap['calculation'] ?? 'exclusive') === 'inclusive') {
            $net = round($fare / (1 + $rate), 2);
            $tax = round($fare - $net, 2);

            return [
                'net' => $net,
                'tax' => $tax,
                'paid' => $fare,
                'tax_code_id' => $snap['tax_code_id'],
            ];
        }

        $tax = round($fare * $rate, 2);

        return [
            'net' => $fare,
            'tax' => $tax,
            'paid' => round($fare + $tax, 2),
            'tax_code_id' => $snap['tax_code_id'],
        ];
    }
}
