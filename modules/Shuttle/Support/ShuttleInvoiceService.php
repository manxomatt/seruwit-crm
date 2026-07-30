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
            if (class_exists(\Modules\Accounting\Support\TaxSettings::class)) {
                $taxAttrs = \Modules\Accounting\Support\TaxSettings::documentAttributes();
            } else {
                $taxEnabled = Setting::getValue('ecommerce.tax_enabled', '1') === '1';
                $taxRate = (float) Setting::getValue('ecommerce.tax_rate', '11');
                $taxAttrs = [
                    'tax_enabled' => $taxEnabled,
                    'tax_rate' => $taxEnabled ? $taxRate : 0,
                    'tax_code_id' => null,
                    'tax_code' => null,
                    'tax_calculation' => 'exclusive',
                ];
            }

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
}
