<?php

namespace Modules\Sales\Support;

use App\Models\Setting;
use App\Modules\Facades\Modules;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\ValidationException;
use Modules\Inventory\Support\StockMovementRecorder;
use Modules\Inventory\Support\StockReservationService;
use Modules\Invoicing\Models\Invoice;
use Modules\Invoicing\Models\InvoiceLine;
use Modules\Sales\Models\SalesOrder;
use Modules\Sales\Models\SalesReturn;
use Modules\Sales\Models\SalesReturnItem;
use RuntimeException;

class SalesReturnConfirmationService
{
    public function confirm(SalesReturn $salesReturn, bool $createCreditNote = true): SalesReturn
    {
        return DB::transaction(function () use ($salesReturn, $createCreditNote) {
            $salesReturn->refresh();
            $salesReturn->load([
                'items.salesOrderItem.product',
                'items.salesOrderItem.packaging',
                'items.ginItem',
                'salesOrder.partner',
            ]);

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

                if ($item->gin_item_id) {
                    $remaining = SalesReturnQuantity::remainingForGinItem(
                        (float) ($item->ginItem?->quantity_issued ?? 0),
                        (int) $item->gin_item_id,
                        $salesReturn->id
                    );

                    if ($returnQty > $remaining + 0.009) {
                        throw new RuntimeException(__('sales.messages.return_qty_exceeds_delivered', [
                            'product' => $soItem->product?->name ?? 'Product',
                            'remaining' => $remaining,
                        ]));
                    }
                }

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

                $so = $salesReturn->salesOrder;
                if ($baseQty > 0 && ! in_array($so->status, [SalesOrder::STATUS_CANCELLED, SalesOrder::STATUS_CLOSED], true)) {
                    try {
                        StockReservationService::reserveAdditionalForSalesOrderItem(
                            $so,
                            $soItem->fresh(['product', 'packaging']),
                            $baseQty,
                        );
                    } catch (ValidationException $e) {
                        $message = collect($e->errors())->flatten()->first()
                            ?? __('sales.messages.return_rereserve_failed');

                        throw new RuntimeException($message);
                    }
                }
            }

            $salesReturn->update(['status' => SalesReturn::STATUS_CONFIRMED]);
            app(GinConfirmationService::class)->recalculateSalesOrderStatus($salesReturn->salesOrder->fresh(['items']));

            if (class_exists(\Modules\Accounting\Support\AccountingBridge::class)) {
                \Modules\Accounting\Support\AccountingBridge::salesReturnConfirmed(
                    $salesReturn->fresh(['items.salesOrderItem.product', 'items.salesOrderItem.packaging'])
                );
            }

            if ($createCreditNote && Modules::available('invoicing') && Schema::hasTable('invoices')) {
                $this->createCreditInvoice($salesReturn->fresh(['items.salesOrderItem.product', 'salesOrder']));
            }

            return $salesReturn->fresh(['items', 'salesOrder', 'warehouse']);
        });
    }

    public function void(SalesReturn $salesReturn): SalesReturn
    {
        return DB::transaction(function () use ($salesReturn) {
            $salesReturn->refresh();
            $salesReturn->load([
                'items.salesOrderItem.product',
                'items.salesOrderItem.packaging',
                'salesOrder',
            ]);

            if ($salesReturn->status !== SalesReturn::STATUS_CONFIRMED) {
                throw new RuntimeException(__('sales.messages.return_void_confirmed_only'));
            }

            $so = $salesReturn->salesOrder;
            if ($so->status === SalesOrder::STATUS_CLOSED) {
                throw new RuntimeException(__('sales.messages.return_void_closed_so'));
            }

            foreach ($salesReturn->items as $item) {
                $soItem = $item->salesOrderItem;
                $baseQty = app(GinConfirmationService::class)->toBaseQuantity(
                    (float) $item->quantity_returned,
                    $soItem
                );

                StockMovementRecorder::record([
                    'product_id' => $soItem->product_id,
                    'warehouse_id' => $salesReturn->warehouse_id,
                    'location_id' => $item->location_id,
                    'type' => 'out',
                    'quantity' => $baseQty,
                    'source_type' => 'sales_return_void',
                    'source_id' => $item->id,
                    'reference_code' => $salesReturn->return_number,
                    'batch_number' => $item->batch_number,
                    'expiry_date' => $item->expiry_date?->toDateString(),
                    'notes' => __('sales.messages.return_void_notes', ['return' => $salesReturn->return_number]),
                    'recorded_by' => auth()->id(),
                    'recorded_at' => now(),
                    'allocate' => filled($item->batch_number) ? false : true,
                ]);

                if ($baseQty > 0) {
                    StockReservationService::releaseForSalesOrderItem($soItem, $baseQty);
                }

                $soItem->increment('quantity_delivered', (float) $item->quantity_returned);
            }

            $this->voidLinkedCreditInvoice($salesReturn);

            $salesReturn->update(['status' => SalesReturn::STATUS_VOIDED]);
            app(GinConfirmationService::class)->recalculateSalesOrderStatus($so->fresh(['items']));

            if (class_exists(\Modules\Accounting\Support\AccountingBridge::class)) {
                \Modules\Accounting\Support\AccountingBridge::salesReturnVoided($salesReturn);
            }

            return $salesReturn->fresh(['items', 'salesOrder', 'warehouse']);
        });
    }

    private function voidLinkedCreditInvoice(SalesReturn $salesReturn): void
    {
        if (! Schema::hasTable('invoice_lines')) {
            return;
        }

        foreach ($salesReturn->items as $item) {
            $lines = InvoiceLine::query()
                ->where('source_type', $item->getMorphClass())
                ->where('source_id', $item->id)
                ->with('invoice')
                ->get();

            foreach ($lines as $line) {
                $invoice = $line->invoice;
                if (! $invoice || $invoice->status === Invoice::STATUS_VOID) {
                    continue;
                }

                if ((float) $invoice->amount_paid > 0.009) {
                    throw new RuntimeException(__('sales.messages.return_void_credit_paid'));
                }

                $invoice->update(['status' => Invoice::STATUS_VOID]);

                if (class_exists(\Modules\Accounting\Support\AccountingBridge::class)) {
                    \Modules\Accounting\Support\AccountingBridge::invoiceVoided($invoice->fresh());
                }
            }
        }
    }

    private function createCreditInvoice(SalesReturn $salesReturn): Invoice
    {
        $so = $salesReturn->salesOrder;
        if (class_exists(\Modules\Accounting\Support\TaxSettings::class)) {
            [$taxEnabled, $taxRate] = \Modules\Accounting\Support\TaxSettings::enabledAndRate();
        } else {
            $taxEnabled = Setting::getValue('ecommerce.tax_enabled', '1') === '1';
            $taxRate = (float) Setting::getValue('ecommerce.tax_rate', '11');
        }

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
            $amount = -1 * round($qty * (float) ($soItem?->netUnitPrice() ?? $soItem?->unit_price ?? 0), 2);

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
        $invoice->update(['status' => Invoice::STATUS_ISSUED]);

        if (class_exists(\Modules\Accounting\Support\AccountingBridge::class)) {
            \Modules\Accounting\Support\AccountingBridge::invoiceIssued($invoice->fresh());
        }

        return $invoice;
    }
}
