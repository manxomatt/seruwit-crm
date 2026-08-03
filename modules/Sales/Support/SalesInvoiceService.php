<?php

namespace Modules\Sales\Support;

use App\Models\Setting;
use App\Modules\Facades\Modules;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Modules\Invoicing\Models\Invoice;
use Modules\Invoicing\Models\InvoiceLine;
use Modules\Sales\Models\GoodsIssueNote;
use Modules\Sales\Models\GoodsIssueNoteItem;
use Modules\Sales\Models\SalesOrder;
use RuntimeException;

class SalesInvoiceService
{
    public function isAvailable(): bool
    {
        return Modules::available('invoicing') && Schema::hasTable('invoices');
    }

    public function ginItemHasActiveInvoice(GoodsIssueNoteItem $ginItem): bool
    {
        if (! Schema::hasTable('invoice_lines')) {
            return false;
        }

        return InvoiceLine::query()
            ->where('source_type', $ginItem->getMorphClass())
            ->where('source_id', $ginItem->id)
            ->whereHas('invoice', fn ($query) => $query->where('status', '!=', Invoice::STATUS_VOID))
            ->exists();
    }

    /**
     * @return list<GoodsIssueNoteItem>
     */
    public function billableGinItemsForSalesOrder(SalesOrder $so): array
    {
        $so->loadMissing([
            'goodsIssueNotes' => fn ($q) => $q
                ->where('status', GoodsIssueNote::STATUS_CONFIRMED)
                ->with(['items.salesOrderItem.product']),
        ]);

        $billable = [];

        foreach ($so->goodsIssueNotes as $gin) {
            foreach ($gin->items as $ginItem) {
                if (! $this->ginItemHasActiveInvoice($ginItem)) {
                    $billable[] = $ginItem;
                }
            }
        }

        return $billable;
    }

    public function hasBillableDelivery(SalesOrder $so): bool
    {
        return $this->billableGinItemsForSalesOrder($so) !== [];
    }

    public function createFromSalesOrder(SalesOrder $so): Invoice
    {
        if (! $this->isAvailable()) {
            throw new RuntimeException(__('sales.messages.invoice_module_unavailable'));
        }

        if (! in_array($so->status, [
            SalesOrder::STATUS_CONFIRMED,
            SalesOrder::STATUS_PARTIAL_DELIVERED,
            SalesOrder::STATUS_FULLY_DELIVERED,
        ], true)) {
            throw new RuntimeException(__('sales.messages.invoice_invalid_status'));
        }

        $billableItems = $this->billableGinItemsForSalesOrder($so);

        if ($billableItems === []) {
            throw new RuntimeException(__('sales.messages.invoice_no_delivered_qty'));
        }

        return $this->createInvoiceForGinItems($so, $billableItems, __('sales.messages.invoice_from_so_notes', [
            'so' => $so->so_number,
        ]));
    }

    public function createFromGin(GoodsIssueNote $gin): Invoice
    {
        if (! $this->isAvailable()) {
            throw new RuntimeException(__('sales.messages.invoice_module_unavailable'));
        }

        if ($gin->status !== GoodsIssueNote::STATUS_CONFIRMED) {
            throw new RuntimeException(__('sales.messages.invoice_gin_confirmed_only'));
        }

        $gin->load(['items.salesOrderItem.product', 'salesOrder.partner']);
        $so = $gin->salesOrder;

        $billableItems = $gin->items
            ->filter(fn (GoodsIssueNoteItem $item): bool => ! $this->ginItemHasActiveInvoice($item))
            ->values()
            ->all();

        if ($billableItems === []) {
            throw new RuntimeException(__('sales.messages.invoice_gin_already_invoiced'));
        }

        return $this->createInvoiceForGinItems($so, $billableItems, __('sales.messages.invoice_from_gin_notes', [
            'gin' => $gin->gin_number,
            'so' => $so->so_number,
        ]));
    }

    /**
     * @param  list<GoodsIssueNoteItem>  $ginItems
     */
    private function createInvoiceForGinItems(SalesOrder $so, array $ginItems, string $notes): Invoice
    {
        $so->loadMissing('partner');

        return DB::transaction(function () use ($so, $ginItems, $notes) {
            if (class_exists(\Modules\Accounting\Support\TaxSettings::class)) {
                $taxAttrs = \Modules\Accounting\Support\TaxSettings::documentAttributesFor(
                    \Modules\Accounting\Support\TaxChannels::SALES_INVOICE,
                );
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

            $invoice = Invoice::create([
                'code' => Invoice::nextCode(),
                'partner_id' => $so->partner_id,
                'status' => Invoice::STATUS_DRAFT,
                'issue_date' => now()->toDateString(),
                'due_date' => null,
                ...$taxAttrs,
                'subtotal' => 0,
                'tax_amount' => 0,
                'total' => 0,
                'amount_paid' => 0,
                'notes' => $notes,
            ]);

            foreach ($ginItems as $ginItem) {
                $soItem = $ginItem->salesOrderItem;
                $productName = $soItem?->product?->name ?? 'Product';
                $unit = $soItem?->unit ?? $soItem?->product?->unit ?? '';
                $qty = (float) $ginItem->quantity_issued;
                $amount = round($qty * (float) ($soItem?->netUnitPrice() ?? $soItem?->unit_price ?? 0), 2);

                InvoiceLine::create([
                    'invoice_id' => $invoice->id,
                    'description' => __('sales.messages.invoice_line_description', [
                        'so' => $so->so_number,
                        'product' => $productName,
                        'qty' => $qty,
                        'unit' => $unit,
                    ]),
                    'amount' => $amount,
                    'source_type' => $ginItem->getMorphClass(),
                    'source_id' => $ginItem->id,
                ]);
            }

            $invoice->recalculate();

            return $invoice->fresh(['lines', 'partner']);
        });
    }
}
