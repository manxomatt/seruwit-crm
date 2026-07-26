<?php

namespace Modules\Sales\Support;

use App\Models\Setting;
use App\Modules\Facades\Modules;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Modules\Inventory\Support\StockMovementRecorder;
use Modules\Invoicing\Models\Invoice;
use Modules\Invoicing\Models\InvoiceLine;
use Modules\Sales\Models\SalesReturn;
use Modules\Sales\Models\SalesReturnItem;
use RuntimeException;

class SalesReturnConfirmationService
{
    public function confirm(SalesReturn $salesReturn, bool $createCreditNote = true): SalesReturn
    {
        return DB::transaction(function () use ($salesReturn, $createCreditNote) {
            $salesReturn->refresh();
            $salesReturn->load(['items.salesOrderItem.product', 'items.salesOrderItem.packaging', 'salesOrder.partner']);

            if ($salesReturn->status !== SalesReturn::STATUS_DRAFT) {
                throw new RuntimeException(__('sales.messages.return_confirm_draft_only'));
            }

            if ($salesReturn->items->isEmpty()) {
                throw new RuntimeException(__('sales.messages.return_need_items'));
            }

            $stockLocationId = app(GinConfirmationService::class)->resolveStockLocationId((int) $salesReturn->warehouse_id);

            foreach ($salesReturn->items as $item) {
                $soItem = $item->salesOrderItem;
                $returnQty = (float) $item->quantity_returned;
                $delivered = (float) $soItem->quantity_delivered;

                if ($returnQty > $delivered) {
                    throw new RuntimeException(__('sales.messages.return_qty_exceeds_delivered', [
                        'product' => $soItem->product?->name ?? 'Product',
                        'remaining' => $delivered,
                    ]));
                }

                $baseQty = app(GinConfirmationService::class)->toBaseQuantity($returnQty, $soItem);
                $locationId = $item->location_id ?: $stockLocationId;

                if ($item->location_id === null && $locationId !== null) {
                    $item->update(['location_id' => $locationId]);
                }

                StockMovementRecorder::record([
                    'product_id' => $soItem->product_id,
                    'warehouse_id' => $salesReturn->warehouse_id,
                    'location_id' => $locationId,
                    'type' => 'in',
                    'quantity' => $baseQty,
                    'source_type' => 'sales_return',
                    'source_id' => $item->id,
                    'reference_code' => $salesReturn->return_number,
                    'batch_number' => $item->batch_number,
                    'expiry_date' => $item->expiry_date?->toDateString(),
                    'recorded_by' => auth()->id(),
                    'recorded_at' => now(),
                    'allocate' => false,
                ]);

                $soItem->decrement('quantity_delivered', $returnQty);
                if ((float) $soItem->fresh()->quantity_delivered < 0) {
                    $soItem->update(['quantity_delivered' => 0]);
                }
            }

            $salesReturn->update(['status' => SalesReturn::STATUS_CONFIRMED]);
            app(GinConfirmationService::class)->recalculateSalesOrderStatus($salesReturn->salesOrder->fresh(['items']));

            if ($createCreditNote && Modules::available('invoicing') && Schema::hasTable('invoices')) {
                $this->createCreditInvoice($salesReturn->fresh(['items.salesOrderItem.product', 'salesOrder']));
            }

            return $salesReturn->fresh(['items', 'salesOrder', 'warehouse']);
        });
    }

    private function createCreditInvoice(SalesReturn $salesReturn): Invoice
    {
        $so = $salesReturn->salesOrder;
        $taxEnabled = Setting::getValue('ecommerce.tax_enabled', '1') === '1';
        $taxRate = (float) Setting::getValue('ecommerce.tax_rate', '11');

        $invoice = Invoice::create([
            'code' => Invoice::nextCode(),
            'partner_id' => $so->partner_id,
            'status' => Invoice::STATUS_DRAFT,
            'issue_date' => now()->toDateString(),
            'due_date' => null,
            'tax_enabled' => $taxEnabled,
            'tax_rate' => $taxEnabled ? $taxRate : 0,
            'subtotal' => 0,
            'tax_amount' => 0,
            'total' => 0,
            'amount_paid' => 0,
            'notes' => __('sales.messages.credit_from_return_notes', [
                'return' => $salesReturn->return_number,
                'so' => $so->so_number,
            ]),
        ]);

        foreach ($salesReturn->items as $item) {
            /** @var SalesReturnItem $item */
            $soItem = $item->salesOrderItem;
            $qty = (float) $item->quantity_returned;
            $amount = -1 * round($qty * (float) ($soItem?->unit_price ?? 0), 2);

            InvoiceLine::create([
                'invoice_id' => $invoice->id,
                'description' => __('sales.messages.credit_line_description', [
                    'return' => $salesReturn->return_number,
                    'product' => $soItem?->product?->name ?? 'Product',
                    'qty' => $qty,
                ]),
                'amount' => $amount,
                'source_type' => $item->getMorphClass(),
                'source_id' => $item->id,
            ]);
        }

        $invoice->recalculate();

        return $invoice;
    }
}
