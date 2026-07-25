<?php

namespace Modules\Sales\Support;

use App\Modules\Facades\Modules;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Modules\Invoicing\Models\Invoice;
use Modules\Invoicing\Models\InvoiceLine;
use Modules\Sales\Models\SalesOrder;
use Modules\Sales\Models\SalesOrderItem;
use RuntimeException;

class SalesInvoiceService
{
    public function isAvailable(): bool
    {
        return Modules::available('invoicing') && Schema::hasTable('invoices');
    }

    public function hasActiveInvoice(SalesOrder $so): bool
    {
        if (! Schema::hasTable('invoice_lines')) {
            return false;
        }

        $itemIds = $so->items()->pluck('id');

        if ($itemIds->isEmpty()) {
            return false;
        }

        return InvoiceLine::query()
            ->where('source_type', (new SalesOrderItem)->getMorphClass())
            ->whereIn('source_id', $itemIds)
            ->whereHas('invoice', fn ($query) => $query->where('status', '!=', Invoice::STATUS_VOID))
            ->exists();
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

        if ($this->hasActiveInvoice($so)) {
            throw new RuntimeException(__('sales.messages.invoice_already_exists'));
        }

        $so->load(['items.product', 'partner']);

        if ($so->items->isEmpty()) {
            throw new RuntimeException(__('sales.messages.so_confirm_need_items'));
        }

        return DB::transaction(function () use ($so) {
            $invoice = Invoice::create([
                'code' => Invoice::nextCode(),
                'partner_id' => $so->partner_id,
                'status' => Invoice::STATUS_DRAFT,
                'issue_date' => now()->toDateString(),
                'due_date' => null,
                'tax_enabled' => false,
                'tax_rate' => 0,
                'subtotal' => 0,
                'tax_amount' => 0,
                'total' => 0,
                'amount_paid' => 0,
                'notes' => __('sales.messages.invoice_from_so_notes', ['so' => $so->so_number]),
            ]);

            foreach ($so->items as $item) {
                $productName = $item->product?->name ?? 'Product';
                $unit = $item->unit ?? $item->product?->unit ?? '';

                InvoiceLine::create([
                    'invoice_id' => $invoice->id,
                    'description' => __('sales.messages.invoice_line_description', [
                        'so' => $so->so_number,
                        'product' => $productName,
                        'qty' => $item->quantity_ordered,
                        'unit' => $unit,
                    ]),
                    'amount' => $item->lineTotal(),
                    'source_type' => $item->getMorphClass(),
                    'source_id' => $item->id,
                ]);
            }

            $invoice->recalculate();

            return $invoice->fresh(['lines', 'partner']);
        });
    }
}
