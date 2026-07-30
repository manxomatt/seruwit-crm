<?php

namespace Modules\Rental\Support;

use App\Models\Setting;
use App\Modules\Facades\Modules;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Modules\Invoicing\Models\Invoice;
use Modules\Invoicing\Models\InvoiceLine;
use Modules\Invoicing\Support\PaymentTerms;
use Modules\Rental\Models\Rental;
use Modules\Rental\Models\RentalCharge;
use Modules\Rental\Models\RentalDamage;
use Modules\Rental\Models\RentalExtension;

class RentalInvoiceService
{
    public function isAvailable(): bool
    {
        return Modules::available('invoicing')
            && Schema::hasTable('invoices')
            && Schema::hasTable('rental_charges');
    }

    public function chargeHasActiveInvoice(RentalCharge $charge): bool
    {
        if (! Schema::hasTable('invoice_lines')) {
            return false;
        }

        return InvoiceLine::query()
            ->where('source_type', $charge->getMorphClass())
            ->where('source_id', $charge->id)
            ->whereHas('invoice', fn ($query) => $query->where('status', '!=', Invoice::STATUS_VOID))
            ->exists();
    }

    /**
     * Create (or reuse) the base rental charge and raise a draft invoice for it.
     */
    public function invoiceBase(Rental $rental): ?Invoice
    {
        if (! $this->isAvailable() || (float) $rental->base_amount <= 0) {
            return null;
        }

        $charge = $this->ensureCharge(
            $rental,
            RentalCharge::KIND_BASE,
            (float) $rental->base_amount,
            __('rental.invoice.line_base', ['code' => $rental->code]),
        );

        return $this->invoiceCharge($rental, $charge, __('rental.invoice.notes_base', ['code' => $rental->code]));
    }

    public function invoiceExtension(Rental $rental, RentalExtension $extension): ?Invoice
    {
        if (! $this->isAvailable() || (float) $extension->additional_amount <= 0) {
            return null;
        }

        $charge = $this->ensureCharge(
            $rental,
            RentalCharge::KIND_EXTENSION,
            (float) $extension->additional_amount,
            __('rental.invoice.line_extension', [
                'code' => $rental->code,
                'from' => $extension->original_end_date->toDateString(),
                'to' => $extension->new_end_date->toDateString(),
            ]),
            extensionId: $extension->id,
        );

        return $this->invoiceCharge($rental, $charge, __('rental.invoice.notes_extension', ['code' => $rental->code]));
    }

    public function invoiceExcessKm(Rental $rental): ?Invoice
    {
        if (! $this->isAvailable() || (float) $rental->excess_amount <= 0) {
            return null;
        }

        $charge = $this->ensureCharge(
            $rental,
            RentalCharge::KIND_EXCESS_KM,
            (float) $rental->excess_amount,
            __('rental.invoice.line_excess_km', [
                'code' => $rental->code,
                'km' => $rental->excess_km ?? 0,
            ]),
        );

        return $this->invoiceCharge($rental, $charge, __('rental.invoice.notes_excess_km', ['code' => $rental->code]));
    }

    public function invoiceLateFee(Rental $rental): ?Invoice
    {
        if (! $this->isAvailable() || (float) $rental->late_fee_amount <= 0) {
            return null;
        }

        $charge = $this->ensureCharge(
            $rental,
            RentalCharge::KIND_LATE_FEE,
            (float) $rental->late_fee_amount,
            __('rental.invoice.line_late_fee', [
                'code' => $rental->code,
                'days' => $rental->overdue_days ?? 0,
            ]),
        );

        return $this->invoiceCharge($rental, $charge, __('rental.invoice.notes_late_fee', ['code' => $rental->code]));
    }

    public function invoiceDamage(Rental $rental, RentalDamage $damage): ?Invoice
    {
        if (! $this->isAvailable() || (float) $damage->amount <= 0) {
            return null;
        }

        $charge = $this->ensureCharge(
            $rental,
            RentalCharge::KIND_DAMAGE,
            (float) $damage->amount,
            __('rental.invoice.line_damage', [
                'code' => $rental->code,
                'description' => $damage->description,
            ]),
            damageId: $damage->id,
        );

        return $this->invoiceCharge($rental, $charge, __('rental.invoice.notes_damage', ['code' => $rental->code]));
    }

    /**
     * Bill a one-off add-on (insurance, baby seat, etc.). Always creates a new charge row.
     */
    public function invoiceAddon(Rental $rental, RentalCharge $charge): ?Invoice
    {
        if (! $this->isAvailable() || (float) $charge->amount <= 0) {
            return null;
        }

        return $this->invoiceCharge(
            $rental,
            $charge,
            __('rental.invoice.notes_addon', ['code' => $rental->code]),
        );
    }

    /**
     * @return array{
     *     status: string,
     *     total_invoiced: float,
     *     total_paid: float,
     *     balance_due: float,
     *     invoices: list<array{id: int, code: string, status: string, issue_date: string|null, due_date: string|null, total: float, amount_paid: float, balance: float}>
     * }
     */
    public function paymentSummary(Rental $rental): array
    {
        $empty = [
            'status' => 'none',
            'total_invoiced' => 0.0,
            'total_paid' => 0.0,
            'balance_due' => 0.0,
            'invoices' => [],
        ];

        if (! $this->isAvailable()) {
            return $empty;
        }

        $invoices = $this->invoicesFor($rental);

        if ($invoices->isEmpty()) {
            return $empty;
        }

        $rows = $invoices->map(fn (Invoice $invoice): array => [
            'id' => $invoice->id,
            'code' => $invoice->code,
            'status' => $invoice->status,
            'issue_date' => $invoice->issue_date?->toDateString(),
            'due_date' => $invoice->due_date?->toDateString(),
            'total' => (float) $invoice->total,
            'amount_paid' => (float) ($invoice->amount_paid ?? 0),
            'balance' => $invoice->balanceDue(),
        ])->values()->all();

        $totalInvoiced = round(array_sum(array_column($rows, 'total')), 2);
        $totalPaid = round(array_sum(array_column($rows, 'amount_paid')), 2);
        $balanceDue = round(array_sum(array_column($rows, 'balance')), 2);

        $statuses = $invoices->pluck('status')->unique()->values();
        $status = 'unpaid';

        if ($statuses->every(fn (string $s): bool => $s === Invoice::STATUS_PAID || $s === Invoice::STATUS_DRAFT || $s === Invoice::STATUS_VOID)) {
            $nonDraft = $invoices->filter(fn (Invoice $i): bool => ! in_array($i->status, [Invoice::STATUS_DRAFT, Invoice::STATUS_VOID], true));
            if ($nonDraft->isEmpty()) {
                $status = $invoices->contains(fn (Invoice $i): bool => $i->status === Invoice::STATUS_DRAFT) ? 'draft' : 'none';
            } elseif ($nonDraft->every(fn (Invoice $i): bool => $i->status === Invoice::STATUS_PAID)) {
                $status = 'paid';
            }
        } elseif ($totalPaid > 0 && $balanceDue > 0) {
            $status = 'partial';
        } elseif ($balanceDue <= 0 && $totalInvoiced > 0) {
            $status = 'paid';
        }

        if ($status === 'unpaid' && $invoices->every(fn (Invoice $i): bool => $i->status === Invoice::STATUS_DRAFT)) {
            $status = 'draft';
        }

        return [
            'status' => $status,
            'total_invoiced' => $totalInvoiced,
            'total_paid' => $totalPaid,
            'balance_due' => $balanceDue,
            'invoices' => $rows,
        ];
    }

    /**
     * @return Collection<int, Invoice>
     */
    public function invoicesFor(Rental $rental): Collection
    {
        $chargeIds = $rental->charges()->pluck('id');

        if ($chargeIds->isEmpty()) {
            return collect();
        }

        $morph = (new RentalCharge)->getMorphClass();

        return Invoice::query()
            ->where('status', '!=', Invoice::STATUS_VOID)
            ->whereHas('lines', fn ($q) => $q
                ->where('source_type', $morph)
                ->whereIn('source_id', $chargeIds))
            ->with('lines')
            ->orderBy('id')
            ->get()
            ->unique('id')
            ->values();
    }

    private function ensureCharge(
        Rental $rental,
        string $kind,
        float $amount,
        string $description,
        ?int $extensionId = null,
        ?int $damageId = null,
    ): RentalCharge {
        $query = RentalCharge::query()->where('rental_id', $rental->id)->where('kind', $kind);

        if ($extensionId !== null) {
            $query->where('rental_extension_id', $extensionId);
        } elseif ($damageId !== null) {
            $query->where('rental_damage_id', $damageId);
        } elseif (in_array($kind, [RentalCharge::KIND_BASE, RentalCharge::KIND_EXCESS_KM, RentalCharge::KIND_LATE_FEE], true)) {
            $query->whereNull('rental_extension_id')->whereNull('rental_damage_id');
        }

        $existing = $query->first();

        if ($existing) {
            if (! $this->chargeHasActiveInvoice($existing)) {
                $existing->update([
                    'amount' => $amount,
                    'description' => $description,
                ]);
            }

            return $existing->fresh();
        }

        return RentalCharge::query()->create([
            'rental_id' => $rental->id,
            'kind' => $kind,
            'amount' => $amount,
            'description' => $description,
            'rental_extension_id' => $extensionId,
            'rental_damage_id' => $damageId,
        ]);
    }

    private function invoiceCharge(Rental $rental, RentalCharge $charge, string $notes): ?Invoice
    {
        if ($this->chargeHasActiveInvoice($charge)) {
            return $charge->invoiceLine?->invoice;
        }

        $rental->loadMissing('partner');

        return DB::transaction(function () use ($rental, $charge, $notes) {
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

            $issueDate = now()->toDateString();

            $invoice = Invoice::create([
                'code' => Invoice::nextCode(),
                'partner_id' => $rental->partner_id,
                'status' => Invoice::STATUS_DRAFT,
                'issue_date' => $issueDate,
                'due_date' => PaymentTerms::dueDateFor($issueDate, $rental->partner),
                ...$taxAttrs,
                'subtotal' => 0,
                'tax_amount' => 0,
                'total' => 0,
                'amount_paid' => 0,
                'notes' => $notes,
            ]);

            InvoiceLine::create([
                'invoice_id' => $invoice->id,
                'description' => $charge->description,
                'amount' => $charge->amount,
                'source_type' => $charge->getMorphClass(),
                'source_id' => $charge->id,
            ]);

            $invoice->recalculate();

            return $invoice->fresh(['lines', 'partner']);
        });
    }
}
