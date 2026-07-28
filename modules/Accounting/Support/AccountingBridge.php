<?php

namespace Modules\Accounting\Support;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Modules\Accounting\Models\CompanyBankAccount;
use Modules\Accounting\Models\JournalEntry;
use Modules\Inventory\Models\StockOpname;
use Modules\Invoicing\Models\Invoice;
use Modules\Payables\Models\BillPayment;
use Modules\Payables\Models\SupplierBill;
use Modules\Pos\Models\PosSale;
use Modules\Pos\Models\PosShift;
use Modules\Purchasing\Models\GoodReceiptNote;
use Modules\Purchasing\Models\PurchaseReturn;
use Modules\Receivables\Models\Payment;
use Modules\Sales\Models\GoodsIssueNote;
use Modules\Sales\Models\SalesReturn;

/**
 * Soft-depend facade for operational modules. Call sites use class_exists on
 * this class so tenants without Accounting keep working unchanged.
 */
class AccountingBridge
{
    public static function available(): bool
    {
        return AccountingPoster::isReady();
    }

    public static function invoiceIssued(Invoice $invoice): ?JournalEntry
    {
        if (! self::available()) {
            return null;
        }

        $eventKey = $invoice->isCreditNote() ? 'credit_note.issued' : 'invoice.issued';

        return app(AccountingPoster::class)->post(new SourceEvent(
            key: $eventKey,
            sourceType: $invoice->getMorphClass(),
            sourceId: (int) $invoice->id,
            occurredAt: ($invoice->issue_date ?? now())->toDateString(),
            amounts: [
                'net' => (float) $invoice->subtotal,
                'tax' => (float) $invoice->tax_amount,
                'total' => (float) $invoice->total,
            ],
            partnerId: (int) $invoice->partner_id,
            memo: __('accounting.messages.source_invoice', ['code' => $invoice->code]),
        ));
    }

    public static function invoiceVoided(Invoice $invoice): ?JournalEntry
    {
        if (! self::available()) {
            return null;
        }

        $original = $invoice->isCreditNote() ? 'credit_note.issued' : 'invoice.issued';
        $voidEvent = $invoice->isCreditNote() ? 'credit_note.voided' : 'invoice.voided';

        return app(AccountingPoster::class)->reverse(
            sourceType: $invoice->getMorphClass(),
            sourceId: (int) $invoice->id,
            originalEvent: $original,
            voidEvent: $voidEvent,
            occurredAt: now()->toDateString(),
            memo: __('accounting.messages.source_invoice_void', ['code' => $invoice->code]),
        );
    }

    public static function paymentRecorded(Payment $payment): ?JournalEntry
    {
        if (! self::available()) {
            return null;
        }

        $entry = app(AccountingPoster::class)->post(new SourceEvent(
            key: 'ar_payment.recorded',
            sourceType: $payment->getMorphClass(),
            sourceId: (int) $payment->id,
            occurredAt: ($payment->payment_date ?? now())->toDateString(),
            amounts: ['paid' => (float) $payment->amount],
            partnerId: (int) $payment->partner_id,
            memo: __('accounting.messages.source_ar_payment', ['code' => $payment->code]),
            context: [
                'payment_method' => $payment->method,
                'company_bank_account_id' => $payment->company_bank_account_id,
            ],
        ));

        app(BankBookService::class)->recordInboundPayment($payment);

        return $entry;
    }

    public static function paymentVoided(Payment $payment): ?JournalEntry
    {
        if (! self::available()) {
            return null;
        }

        $entry = app(AccountingPoster::class)->reverse(
            sourceType: $payment->getMorphClass(),
            sourceId: (int) $payment->id,
            originalEvent: 'ar_payment.recorded',
            voidEvent: 'ar_payment.voided',
            occurredAt: now()->toDateString(),
            memo: __('accounting.messages.source_ar_payment_void', ['code' => $payment->code]),
        );

        app(BankBookService::class)->voidForSource($payment);

        return $entry;
    }

    public static function billIssued(SupplierBill $bill): ?JournalEntry
    {
        if (! self::available()) {
            return null;
        }

        $eventKey = $bill->isCreditNote() ? 'supplier_credit.issued' : 'supplier_bill.issued';

        return app(AccountingPoster::class)->post(new SourceEvent(
            key: $eventKey,
            sourceType: $bill->getMorphClass(),
            sourceId: (int) $bill->id,
            occurredAt: ($bill->bill_date ?? now())->toDateString(),
            amounts: [
                'net' => (float) $bill->subtotal,
                'tax' => (float) $bill->tax_amount,
                'total' => (float) $bill->total,
            ],
            partnerId: (int) $bill->partner_id,
            memo: __('accounting.messages.source_bill', ['code' => $bill->code]),
            context: ['has_grn' => $bill->good_receipt_note_id !== null],
        ));
    }

    public static function billVoided(SupplierBill $bill): ?JournalEntry
    {
        if (! self::available()) {
            return null;
        }

        $original = $bill->isCreditNote() ? 'supplier_credit.issued' : 'supplier_bill.issued';
        $voidEvent = $bill->isCreditNote() ? 'supplier_credit.voided' : 'supplier_bill.voided';

        return app(AccountingPoster::class)->reverse(
            sourceType: $bill->getMorphClass(),
            sourceId: (int) $bill->id,
            originalEvent: $original,
            voidEvent: $voidEvent,
            occurredAt: now()->toDateString(),
            memo: __('accounting.messages.source_bill_void', ['code' => $bill->code]),
        );
    }

    public static function billPaymentRecorded(BillPayment $payment): ?JournalEntry
    {
        if (! self::available()) {
            return null;
        }

        $paid = round((float) $payment->amount, 2);
        $wht = round((float) ($payment->wht_amount ?? 0), 2);
        $paidNet = round(max(0, $paid - $wht), 2);

        $entry = app(AccountingPoster::class)->post(new SourceEvent(
            key: 'bill_payment.recorded',
            sourceType: $payment->getMorphClass(),
            sourceId: (int) $payment->id,
            occurredAt: ($payment->payment_date ?? now())->toDateString(),
            amounts: [
                'paid' => $paid,
                'wht' => $wht,
                'paid_net' => $paidNet,
            ],
            partnerId: (int) $payment->partner_id,
            memo: __('accounting.messages.source_bill_payment', ['code' => $payment->code]),
            context: [
                'payment_method' => $payment->method,
                'company_bank_account_id' => $payment->company_bank_account_id,
                'wht_tax_code_id' => $payment->wht_tax_code_id ?? null,
            ],
        ));

        app(BankBookService::class)->recordOutboundBillPayment($payment);

        return $entry;
    }

    public static function billPaymentVoided(BillPayment $payment): ?JournalEntry
    {
        if (! self::available()) {
            return null;
        }

        $entry = app(AccountingPoster::class)->reverse(
            sourceType: $payment->getMorphClass(),
            sourceId: (int) $payment->id,
            originalEvent: 'bill_payment.recorded',
            voidEvent: 'bill_payment.voided',
            occurredAt: now()->toDateString(),
            memo: __('accounting.messages.source_bill_payment_void', ['code' => $payment->code]),
        );

        app(BankBookService::class)->voidForSource($payment);

        return $entry;
    }

    public static function posShiftClosed(PosShift $shift): ?JournalEntry
    {
        if (! self::available()) {
            return null;
        }

        $varianceEntry = self::postPosShiftVariance($shift);
        self::postPosShiftDeposit($shift);

        return $varianceEntry;
    }

    public static function postPosShiftVariance(PosShift $shift): ?JournalEntry
    {
        if (! self::available()) {
            return null;
        }

        $variance = round((float) ($shift->cash_variance ?? 0), 2);
        if (abs($variance) < 0.005) {
            return null;
        }

        $isShortage = $variance < 0;

        return app(AccountingPoster::class)->post(new SourceEvent(
            key: $isShortage ? 'pos_shift.shortage' : 'pos_shift.overage',
            sourceType: $shift->getMorphClass(),
            sourceId: (int) $shift->id,
            occurredAt: ($shift->closed_at ?? now())->toDateString(),
            amounts: ['variance' => abs($variance)],
            warehouseId: (int) $shift->warehouse_id,
            memo: $isShortage
                ? __('accounting.messages.source_pos_shift_shortage', ['id' => (string) $shift->id])
                : __('accounting.messages.source_pos_shift_overage', ['id' => (string) $shift->id]),
            context: [
                'payment_method' => 'cash',
            ],
        ));
    }

    public static function postPosShiftDeposit(PosShift $shift): ?JournalEntry
    {
        if (! self::available() || ! BankBookService::isReady()) {
            return null;
        }

        if (! \Illuminate\Support\Facades\Schema::hasColumn('pos_shifts', 'deposit_to_company_bank_account_id')) {
            return null;
        }

        $amount = round((float) ($shift->deposit_amount ?? 0), 2);
        $toId = (int) ($shift->deposit_to_company_bank_account_id ?? 0);

        if ($amount < 0.005 || $toId < 1) {
            return null;
        }

        $poster = app(AccountingPoster::class);
        $existing = $poster->findPosted($shift->getMorphClass(), (int) $shift->id, 'pos_shift.deposit');
        if ($existing !== null) {
            return $existing;
        }

        $from = app(PaymentAccountResolver::class)->resolveCompanyAccount(method: 'cash');
        $to = CompanyBankAccount::query()
            ->with('ledgerAccount')
            ->whereKey($toId)
            ->where('is_active', true)
            ->first();

        if ($from === null || $to === null) {
            throw ValidationException::withMessages([
                'deposit_to_company_bank_account_id' => __('accounting.validation.bank_account_inactive'),
            ]);
        }

        if ((int) $from->id === (int) $to->id) {
            return null;
        }

        $from->loadMissing('ledgerAccount');
        $fromLedger = $from->ledgerAccount;
        $toLedger = $to->ledgerAccount;

        if ($fromLedger === null || ! $fromLedger->is_active || ! $fromLedger->is_postable
            || $toLedger === null || ! $toLedger->is_active || ! $toLedger->is_postable) {
            throw ValidationException::withMessages([
                'deposit_to_company_bank_account_id' => __('accounting.validation.bank_account_coa_invalid'),
            ]);
        }

        $date = ($shift->closed_at ?? now())->toDateString();
        $memo = __('accounting.messages.source_pos_shift_deposit', ['id' => (string) $shift->id]);

        return DB::transaction(function () use ($shift, $from, $to, $fromLedger, $toLedger, $amount, $date, $memo): ?JournalEntry {
            app(BankBookService::class)->recordTransfer(
                from: $from,
                to: $to,
                amount: $amount,
                date: $date,
                reference: 'POS-SHIFT-'.$shift->id,
                memo: $memo,
                source: $shift,
            );

            if ((int) $fromLedger->id === (int) $toLedger->id) {
                return null;
            }

            $again = app(AccountingPoster::class)->findPosted(
                $shift->getMorphClass(),
                (int) $shift->id,
                'pos_shift.deposit',
            );
            if ($again !== null) {
                return $again;
            }

            $entry = app(JournalService::class)->createDraft([
                'entry_date' => $date,
                'type' => JournalEntry::TYPE_AUTO,
                'memo' => $memo,
                'lines' => [
                    ['account_id' => $toLedger->id, 'debit' => $amount, 'credit' => 0, 'warehouse_id' => (int) $shift->warehouse_id],
                    ['account_id' => $fromLedger->id, 'debit' => 0, 'credit' => $amount, 'warehouse_id' => (int) $shift->warehouse_id],
                ],
            ], Auth::id());

            $entry->update([
                'source_type' => $shift->getMorphClass(),
                'source_id' => (int) $shift->id,
                'event' => 'pos_shift.deposit',
            ]);

            return app(JournalService::class)->post($entry, Auth::id());
        });
    }

    public static function grnConfirmed(GoodReceiptNote $grn): ?JournalEntry
    {
        if (! self::available()) {
            return null;
        }

        $inventory = app(InventoryCostCalculator::class)->grnInventoryValue($grn);
        if ($inventory < 0.005) {
            return null;
        }

        return app(AccountingPoster::class)->post(new SourceEvent(
            key: 'grn.confirmed',
            sourceType: $grn->getMorphClass(),
            sourceId: (int) $grn->id,
            occurredAt: now()->toDateString(),
            amounts: ['inventory' => $inventory],
            warehouseId: (int) $grn->warehouse_id,
            memo: __('accounting.messages.source_grn', ['code' => $grn->grn_number]),
        ));
    }

    public static function grnVoided(GoodReceiptNote $grn): ?JournalEntry
    {
        if (! self::available()) {
            return null;
        }

        return app(AccountingPoster::class)->reverse(
            sourceType: $grn->getMorphClass(),
            sourceId: (int) $grn->id,
            originalEvent: 'grn.confirmed',
            voidEvent: 'grn.voided',
            occurredAt: now()->toDateString(),
            memo: __('accounting.messages.source_grn_void', ['code' => $grn->grn_number]),
        );
    }

    public static function ginConfirmed(GoodsIssueNote $gin): ?JournalEntry
    {
        if (! self::available()) {
            return null;
        }

        $cogs = app(InventoryCostCalculator::class)->ginCogsValue($gin);
        if ($cogs < 0.005) {
            return null;
        }

        return app(AccountingPoster::class)->post(new SourceEvent(
            key: 'gin.confirmed',
            sourceType: $gin->getMorphClass(),
            sourceId: (int) $gin->id,
            occurredAt: now()->toDateString(),
            amounts: ['cogs' => $cogs],
            warehouseId: (int) $gin->warehouse_id,
            memo: __('accounting.messages.source_gin', ['code' => $gin->gin_number]),
        ));
    }

    public static function ginVoided(GoodsIssueNote $gin): ?JournalEntry
    {
        if (! self::available()) {
            return null;
        }

        return app(AccountingPoster::class)->reverse(
            sourceType: $gin->getMorphClass(),
            sourceId: (int) $gin->id,
            originalEvent: 'gin.confirmed',
            voidEvent: 'gin.voided',
            occurredAt: now()->toDateString(),
            memo: __('accounting.messages.source_gin_void', ['code' => $gin->gin_number]),
        );
    }

    public static function posSaleCompleted(PosSale $sale): ?JournalEntry
    {
        if (! self::available()) {
            return null;
        }

        $sale->loadMissing('payments');
        $cogs = app(InventoryCostCalculator::class)->posSaleCogsValue($sale);
        $method = $sale->payments->first()?->method ?? 'cash';

        return app(AccountingPoster::class)->post(new SourceEvent(
            key: 'pos_sale.completed',
            sourceType: $sale->getMorphClass(),
            sourceId: (int) $sale->id,
            occurredAt: ($sale->sold_at ?? now())->toDateString(),
            amounts: [
                'paid' => (float) $sale->grand_total,
                'net' => (float) $sale->subtotal,
                'tax' => (float) $sale->tax_total,
                'cogs' => $cogs,
            ],
            partnerId: $sale->partner_id ? (int) $sale->partner_id : null,
            warehouseId: (int) $sale->warehouse_id,
            memo: __('accounting.messages.source_pos_sale', ['code' => $sale->code]),
            context: [
                'payment_method' => $method,
                'company_bank_account_id' => $sale->payments->first()?->company_bank_account_id,
            ],
        ));
    }

    public static function posSaleVoided(PosSale $sale): ?JournalEntry
    {
        if (! self::available()) {
            return null;
        }

        return app(AccountingPoster::class)->reverse(
            sourceType: $sale->getMorphClass(),
            sourceId: (int) $sale->id,
            originalEvent: 'pos_sale.completed',
            voidEvent: 'pos_sale.voided',
            occurredAt: now()->toDateString(),
            memo: __('accounting.messages.source_pos_sale_void', ['code' => $sale->code]),
        );
    }

    public static function salesReturnConfirmed(SalesReturn $salesReturn): ?JournalEntry
    {
        if (! self::available()) {
            return null;
        }

        $cogs = app(InventoryCostCalculator::class)->salesReturnCogsValue($salesReturn);
        if ($cogs < 0.005) {
            return null;
        }

        return app(AccountingPoster::class)->post(new SourceEvent(
            key: 'sales_return.confirmed',
            sourceType: $salesReturn->getMorphClass(),
            sourceId: (int) $salesReturn->id,
            occurredAt: now()->toDateString(),
            amounts: ['cogs' => $cogs],
            warehouseId: (int) $salesReturn->warehouse_id,
            memo: __('accounting.messages.source_sales_return', ['code' => $salesReturn->return_number]),
        ));
    }

    public static function salesReturnVoided(SalesReturn $salesReturn): ?JournalEntry
    {
        if (! self::available()) {
            return null;
        }

        return app(AccountingPoster::class)->reverse(
            sourceType: $salesReturn->getMorphClass(),
            sourceId: (int) $salesReturn->id,
            originalEvent: 'sales_return.confirmed',
            voidEvent: 'sales_return.voided',
            occurredAt: now()->toDateString(),
            memo: __('accounting.messages.source_sales_return_void', ['code' => $salesReturn->return_number]),
        );
    }

    public static function purchaseReturnConfirmed(PurchaseReturn $purchaseReturn): ?JournalEntry
    {
        if (! self::available()) {
            return null;
        }

        $inventory = app(InventoryCostCalculator::class)->purchaseReturnInventoryValue($purchaseReturn);
        if ($inventory < 0.005) {
            return null;
        }

        return app(AccountingPoster::class)->post(new SourceEvent(
            key: 'purchase_return.confirmed',
            sourceType: $purchaseReturn->getMorphClass(),
            sourceId: (int) $purchaseReturn->id,
            occurredAt: now()->toDateString(),
            amounts: ['inventory' => $inventory],
            warehouseId: (int) $purchaseReturn->warehouse_id,
            memo: __('accounting.messages.source_purchase_return', ['code' => $purchaseReturn->return_number]),
        ));
    }

    public static function purchaseReturnVoided(PurchaseReturn $purchaseReturn): ?JournalEntry
    {
        if (! self::available()) {
            return null;
        }

        return app(AccountingPoster::class)->reverse(
            sourceType: $purchaseReturn->getMorphClass(),
            sourceId: (int) $purchaseReturn->id,
            originalEvent: 'purchase_return.confirmed',
            voidEvent: 'purchase_return.voided',
            occurredAt: now()->toDateString(),
            memo: __('accounting.messages.source_purchase_return_void', ['code' => $purchaseReturn->return_number]),
        );
    }

    /**
     * @return list<JournalEntry>
     */
    public static function stockOpnameFinalized(StockOpname $opname): array
    {
        if (! self::available()) {
            return [];
        }

        $values = app(InventoryCostCalculator::class)->opnameVarianceValues($opname);
        $poster = app(AccountingPoster::class);
        $entries = [];

        if ($values['surplus'] >= 0.005) {
            $entry = $poster->post(new SourceEvent(
                key: 'stock_opname.surplus',
                sourceType: $opname->getMorphClass(),
                sourceId: (int) $opname->id,
                occurredAt: now()->toDateString(),
                amounts: ['inventory' => $values['surplus']],
                warehouseId: (int) $opname->warehouse_id,
                memo: __('accounting.messages.source_opname_surplus', ['id' => (string) $opname->id]),
            ));
            if ($entry !== null) {
                $entries[] = $entry;
            }
        }

        if ($values['shortage'] >= 0.005) {
            $entry = $poster->post(new SourceEvent(
                key: 'stock_opname.shortage',
                sourceType: $opname->getMorphClass(),
                sourceId: (int) $opname->id,
                occurredAt: now()->toDateString(),
                amounts: ['inventory' => $values['shortage']],
                warehouseId: (int) $opname->warehouse_id,
                memo: __('accounting.messages.source_opname_shortage', ['id' => (string) $opname->id]),
            ));
            if ($entry !== null) {
                $entries[] = $entry;
            }
        }

        return $entries;
    }

    /**
     * @deprecated Prefer typed helpers; kept for generic call sites.
     */
    public static function postFor(Model $source, string $event, array $amounts, string $date, ?int $partnerId = null, array $context = []): ?JournalEntry
    {
        if (! self::available()) {
            return null;
        }

        return app(AccountingPoster::class)->post(new SourceEvent(
            key: $event,
            sourceType: $source->getMorphClass(),
            sourceId: (int) $source->getKey(),
            occurredAt: $date,
            amounts: $amounts,
            partnerId: $partnerId,
            context: $context,
        ));
    }
}
