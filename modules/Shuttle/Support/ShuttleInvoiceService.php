<?php

namespace Modules\Shuttle\Support;

use App\Models\Setting;
use App\Modules\Facades\Modules;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Modules\Invoicing\Models\Invoice;
use Modules\Invoicing\Models\InvoiceLine;
use Modules\Invoicing\Support\PaymentTerms;
use Modules\Shuttle\Models\ShuttleBooking;

class ShuttleInvoiceService
{
    public const REFUND_NONE = 'none';

    public const REFUND_VOIDED = 'voided';

    public const REFUND_CREDITED = 'credited';

    public const REFUND_SKIPPED_PAID = 'skipped_paid';

    public function isAvailable(): bool
    {
        return Modules::available('invoicing') && Schema::hasTable('invoices');
    }

    public function bookingHasActiveInvoice(ShuttleBooking $booking): bool
    {
        if (! Schema::hasTable('invoice_lines')) {
            return false;
        }

        return InvoiceLine::query()
            ->where('source_type', $booking->getMorphClass())
            ->where('source_id', $booking->id)
            ->whereHas('invoice', fn ($query) => $query->where('status', '!=', Invoice::STATUS_VOID))
            ->exists();
    }

    public function createFromBooking(ShuttleBooking $booking): ?Invoice
    {
        if (! $this->isAvailable() || (float) $booking->total_fare <= 0) {
            return null;
        }

        if ($this->bookingHasActiveInvoice($booking)) {
            return Invoice::query()
                ->where('status', '!=', Invoice::STATUS_VOID)
                ->whereHas('lines', fn ($q) => $q
                    ->where('source_type', $booking->getMorphClass())
                    ->where('source_id', $booking->id))
                ->first();
        }

        $booking->loadMissing(['partner', 'departure.corridor']);

        return DB::transaction(function () use ($booking): Invoice {
            $taxAttrs = $this->taxAttributes();

            $corridor = $booking->departure?->corridor;
            $description = __('shuttle.invoice.line', [
                'corridor' => $corridor?->name ?? $corridor?->code ?? 'Travel',
                'date' => $booking->departure?->depart_date?->toDateString() ?? '',
                'pax' => $booking->passenger_count,
            ]);

            $issueDate = now()->toDateString();

            $invoice = Invoice::create([
                'code' => Invoice::nextCode(),
                'partner_id' => $booking->partner_id,
                'status' => Invoice::STATUS_DRAFT,
                'issue_date' => $issueDate,
                'due_date' => PaymentTerms::dueDateFor($issueDate, $booking->partner),
                ...$taxAttrs,
                'subtotal' => 0,
                'tax_amount' => 0,
                'total' => 0,
                'amount_paid' => 0,
                'notes' => __('shuttle.invoice.notes', ['booking' => $booking->booking_number]),
            ]);

            InvoiceLine::create([
                'invoice_id' => $invoice->id,
                'description' => $description,
                'amount' => $booking->total_fare,
                'source_type' => $booking->getMorphClass(),
                'source_id' => $booking->id,
            ]);

            $invoice->recalculate();

            return $invoice->fresh(['lines', 'partner']);
        });
    }

    /**
     * On cancel: void unpaid draft/issued invoice, or issue a credit note when paid.
     *
     * @return array{status: string, credit_invoice_id: int|null}
     */
    public function settleCancellation(ShuttleBooking $booking): array
    {
        if (! $this->isAvailable() || ! $booking->invoice_id) {
            return ['status' => self::REFUND_NONE, 'credit_invoice_id' => null];
        }

        $invoice = Invoice::query()->find($booking->invoice_id);

        if (! $invoice || $invoice->status === Invoice::STATUS_VOID) {
            return ['status' => self::REFUND_NONE, 'credit_invoice_id' => null];
        }

        if ((float) ($invoice->amount_paid ?? 0) > 0 || $invoice->status === Invoice::STATUS_PAID) {
            $credit = $this->createCreditNote($booking, $invoice);

            return [
                'status' => self::REFUND_CREDITED,
                'credit_invoice_id' => $credit?->id,
            ];
        }

        if (in_array($invoice->status, [Invoice::STATUS_DRAFT, Invoice::STATUS_ISSUED, Invoice::STATUS_PARTIALLY_PAID], true)) {
            DB::transaction(function () use ($invoice): void {
                $invoice->lines()->delete();
                $invoice->update(['status' => Invoice::STATUS_VOID]);

                if (class_exists(\Modules\Accounting\Support\AccountingBridge::class)) {
                    \Modules\Accounting\Support\AccountingBridge::invoiceVoided($invoice->fresh());
                }
            });

            return ['status' => self::REFUND_VOIDED, 'credit_invoice_id' => null];
        }

        return ['status' => self::REFUND_SKIPPED_PAID, 'credit_invoice_id' => null];
    }

    public function createCreditNote(ShuttleBooking $booking, Invoice $original): ?Invoice
    {
        if (! $this->isAvailable()) {
            return null;
        }

        $booking->loadMissing(['partner', 'departure.corridor']);
        $taxAttrs = $this->taxAttributes();
        $amount = -1 * abs((float) $booking->total_fare);

        return DB::transaction(function () use ($booking, $original, $taxAttrs, $amount): Invoice {
            $invoice = Invoice::create([
                'code' => Invoice::nextCode(),
                'partner_id' => $booking->partner_id,
                'status' => Invoice::STATUS_DRAFT,
                'issue_date' => now()->toDateString(),
                'due_date' => now()->toDateString(),
                ...$taxAttrs,
                'subtotal' => 0,
                'tax_amount' => 0,
                'total' => 0,
                'amount_paid' => 0,
                'notes' => __('shuttle.invoice.credit_notes', [
                    'booking' => $booking->booking_number,
                    'invoice' => $original->code,
                ]),
            ]);

            InvoiceLine::create([
                'invoice_id' => $invoice->id,
                'description' => __('shuttle.invoice.credit_line', [
                    'booking' => $booking->booking_number,
                ]),
                'amount' => $amount,
                // Leave source null — booking already morphs the original invoice line
                // (unique source_type/source_id), and Postgres treats NULL as distinct.
                'source_type' => null,
                'source_id' => null,
            ]);

            $invoice->recalculate();
            $invoice->update(['status' => Invoice::STATUS_ISSUED]);

            if (class_exists(\Modules\Accounting\Support\AccountingBridge::class)) {
                \Modules\Accounting\Support\AccountingBridge::invoiceIssued($invoice->fresh());
            }

            return $invoice->fresh(['lines']);
        });
    }

    /**
     * @return array<string, mixed>
     */
    private function taxAttributes(): array
    {
        if (class_exists(\Modules\Accounting\Support\TaxSettings::class)) {
            return \Modules\Accounting\Support\TaxSettings::documentAttributes();
        }

        $taxEnabled = Setting::getValue('ecommerce.tax_enabled', '1') === '1';
        $taxRate = (float) Setting::getValue('ecommerce.tax_rate', '11');

        return [
            'tax_enabled' => $taxEnabled,
            'tax_rate' => $taxEnabled ? $taxRate : 0,
            'tax_code_id' => null,
            'tax_code' => null,
            'tax_calculation' => 'exclusive',
        ];
    }
}
