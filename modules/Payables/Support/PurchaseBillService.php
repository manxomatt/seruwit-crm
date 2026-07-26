<?php

namespace Modules\Payables\Support;

use App\Models\Setting;
use App\Modules\Facades\Modules;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Modules\Payables\Models\SupplierBill;
use Modules\Payables\Models\SupplierBillLine;
use Modules\Purchasing\Models\GoodReceiptNote;
use Modules\Purchasing\Models\GoodReceiptNoteItem;
use Modules\Purchasing\Models\PurchaseReturn;
use RuntimeException;

class PurchaseBillService
{
    public function isAvailable(): bool
    {
        return Modules::available('payables') && Schema::hasTable('supplier_bills');
    }

    public function grnItemHasActiveBill(GoodReceiptNoteItem $grnItem): bool
    {
        if (! Schema::hasTable('supplier_bill_lines')) {
            return false;
        }

        return SupplierBillLine::query()
            ->where('source_type', $grnItem->getMorphClass())
            ->where('source_id', $grnItem->id)
            ->whereHas('bill', fn ($q) => $q->where('status', '!=', SupplierBill::STATUS_VOID))
            ->exists();
    }

    public function hasBillableReceipt(GoodReceiptNote $grn): bool
    {
        if ($grn->status !== GoodReceiptNote::STATUS_CONFIRMED) {
            return false;
        }

        $grn->loadMissing('items');

        return $grn->items->contains(
            fn (GoodReceiptNoteItem $item): bool => ! $this->grnItemHasActiveBill($item)
        );
    }

    public function createFromGrn(GoodReceiptNote $grn): SupplierBill
    {
        if (! $this->isAvailable()) {
            throw new RuntimeException(__('payables.messages.module_unavailable'));
        }

        if ($grn->status !== GoodReceiptNote::STATUS_CONFIRMED) {
            throw new RuntimeException(__('payables.messages.grn_confirmed_only'));
        }

        $grn->load(['items.purchaseOrderItem.product', 'purchaseOrder.partner']);

        $billable = $grn->items
            ->filter(fn (GoodReceiptNoteItem $item): bool => ! $this->grnItemHasActiveBill($item))
            ->values();

        if ($billable->isEmpty()) {
            throw new RuntimeException(__('payables.messages.grn_already_billed'));
        }

        $po = $grn->purchaseOrder;
        [$taxEnabled, $taxRate] = $this->taxSettings();

        return DB::transaction(function () use ($grn, $billable, $po, $taxEnabled, $taxRate) {
            $bill = SupplierBill::query()->create([
                'code' => SupplierBill::nextCode(),
                'partner_id' => $po->partner_id,
                'purchase_order_id' => $po->id,
                'good_receipt_note_id' => $grn->id,
                'status' => SupplierBill::STATUS_DRAFT,
                'bill_date' => now()->toDateString(),
                'due_date' => null,
                'tax_enabled' => $taxEnabled,
                'tax_rate' => $taxEnabled ? $taxRate : 0,
                'subtotal' => 0,
                'tax_amount' => 0,
                'total' => 0,
                'amount_paid' => 0,
                'notes' => __('payables.messages.bill_from_grn_notes', [
                    'grn' => $grn->grn_number,
                    'po' => $po->po_number,
                ]),
            ]);

            foreach ($billable as $grnItem) {
                $poItem = $grnItem->purchaseOrderItem;
                $productName = $poItem?->product?->name ?? 'Product';
                $qty = (float) $grnItem->quantity_received;
                $amount = round($qty * (float) ($poItem?->unit_price ?? 0), 2);

                SupplierBillLine::query()->create([
                    'supplier_bill_id' => $bill->id,
                    'description' => __('payables.messages.bill_line_description', [
                        'grn' => $grn->grn_number,
                        'product' => $productName,
                        'qty' => $qty,
                        'unit' => $poItem?->unit ?? '',
                    ]),
                    'amount' => $amount,
                    'expected_amount' => $amount,
                    'source_type' => $grnItem->getMorphClass(),
                    'source_id' => $grnItem->id,
                ]);
            }

            $bill->recalculate();

            return $bill->fresh(['lines', 'partner']);
        });
    }

    public function createCreditFromPurchaseReturn(PurchaseReturn $purchaseReturn): ?SupplierBill
    {
        if (! $this->isAvailable()) {
            return null;
        }

        $purchaseReturn->loadMissing(['items.purchaseOrderItem.product', 'items.grnItem', 'purchaseOrder']);

        $creditable = $purchaseReturn->items->filter(function ($item): bool {
            if (! $item->grn_item_id || ! $item->grnItem) {
                return false;
            }

            return $this->grnItemHasActiveBill($item->grnItem);
        })->values();

        if ($creditable->isEmpty()) {
            return null;
        }

        $po = $purchaseReturn->purchaseOrder;
        [$taxEnabled, $taxRate] = $this->taxSettings();

        return DB::transaction(function () use ($purchaseReturn, $creditable, $po, $taxEnabled, $taxRate) {
            $bill = SupplierBill::query()->create([
                'code' => SupplierBill::nextCode(),
                'partner_id' => $po->partner_id,
                'purchase_order_id' => $po->id,
                'good_receipt_note_id' => $purchaseReturn->good_receipt_note_id,
                'status' => SupplierBill::STATUS_ISSUED,
                'bill_date' => now()->toDateString(),
                'due_date' => null,
                'tax_enabled' => $taxEnabled,
                'tax_rate' => $taxEnabled ? $taxRate : 0,
                'subtotal' => 0,
                'tax_amount' => 0,
                'total' => 0,
                'amount_paid' => 0,
                'notes' => __('payables.messages.credit_from_return_notes', [
                    'return' => $purchaseReturn->return_number,
                    'po' => $po->po_number,
                ]),
            ]);

            foreach ($creditable as $item) {
                $poItem = $item->purchaseOrderItem;
                $qty = (float) $item->quantity_returned;
                $amount = -1 * round($qty * (float) ($poItem?->unit_price ?? 0), 2);

                SupplierBillLine::query()->create([
                    'supplier_bill_id' => $bill->id,
                    'description' => __('payables.messages.credit_line_description', [
                        'return' => $purchaseReturn->return_number,
                        'product' => $poItem?->product?->name ?? 'Product',
                        'qty' => $qty,
                    ]),
                    'amount' => $amount,
                    'expected_amount' => $amount,
                    'source_type' => $item->getMorphClass(),
                    'source_id' => $item->id,
                ]);
            }

            $bill->recalculate();

            return $bill->fresh(['lines', 'partner']);
        });
    }

    /**
     * @return array{0: bool, 1: float}
     */
    private function taxSettings(): array
    {
        $taxEnabled = Setting::getValue('ecommerce.tax_enabled', '1') === '1';
        $taxRate = (float) Setting::getValue('ecommerce.tax_rate', '11');

        return [$taxEnabled, $taxRate];
    }
}
