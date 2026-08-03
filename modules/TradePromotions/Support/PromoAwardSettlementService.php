<?php

namespace Modules\TradePromotions\Support;

use App\Models\Setting;
use App\Modules\Facades\Modules;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Modules\Inventory\Support\AccessibleWarehouses;
use Modules\Invoicing\Models\Invoice;
use Modules\Invoicing\Models\InvoiceLine;
use Modules\Sales\Models\SalesOrder;
use Modules\TradePromotions\Models\TradePromoAward;
use RuntimeException;

/**
 * Settles accrued trade awards into documents:
 * - rebate / discount → credit note (negative invoice), soft-depends invoicing
 * - free_goods → draft sales order of free SKU, soft-depends sales
 * Falls back to flag-only settle when the target module is unavailable.
 */
class PromoAwardSettlementService
{
    public const SETTLEMENT_CREDIT_NOTE = 'credit_note';

    public const SETTLEMENT_SALES_ORDER = 'sales_order';

    public const SETTLEMENT_MANUAL = 'manual';

    /**
     * @return array{award: TradePromoAward, settlement_type: string, settlement_id: int|null}
     */
    public function settle(TradePromoAward $award): array
    {
        if ($award->status === TradePromoAward::STATUS_SETTLED) {
            throw new RuntimeException(__('promotions.messages.award_already_settled'));
        }

        if ($award->status === TradePromoAward::STATUS_VOID) {
            throw new RuntimeException(__('promotions.messages.award_void'));
        }

        return DB::transaction(function () use ($award): array {
            $award->loadMissing(['program', 'partner', 'freeProduct']);

            $settlementType = self::SETTLEMENT_MANUAL;
            $settlementId = null;

            if (in_array($award->award_type, [TradePromoAward::TYPE_REBATE, TradePromoAward::TYPE_DISCOUNT], true)
                && (float) ($award->amount ?? 0) > 0) {
                $invoice = $this->createCreditNote($award);
                if ($invoice !== null) {
                    $settlementType = self::SETTLEMENT_CREDIT_NOTE;
                    $settlementId = (int) $invoice->id;
                }
            }

            if ($award->award_type === TradePromoAward::TYPE_FREE_GOODS
                && $award->free_product_id
                && (float) ($award->free_qty ?? 0) > 0) {
                $so = $this->createFreeGoodsSalesOrder($award);
                if ($so !== null) {
                    $settlementType = self::SETTLEMENT_SALES_ORDER;
                    $settlementId = (int) $so->id;
                }
            }

            $award->update([
                'status' => TradePromoAward::STATUS_SETTLED,
                'settled_at' => now(),
                'settlement_type' => $settlementType,
                'settlement_id' => $settlementId,
            ]);

            return [
                'award' => $award->fresh(),
                'settlement_type' => $settlementType,
                'settlement_id' => $settlementId,
            ];
        });
    }

    protected function createCreditNote(TradePromoAward $award): ?Invoice
    {
        if (! Modules::available('invoicing')
            || ! class_exists(Invoice::class)
            || ! Schema::hasTable('invoices')
            || ! Schema::hasTable('invoice_lines')) {
            return null;
        }

        if (class_exists(\Modules\Accounting\Support\TaxSettings::class)) {
            [$taxEnabled, $taxRate] = \Modules\Accounting\Support\TaxSettings::enabledAndRate(
                \Modules\Accounting\Support\TaxChannels::PROMOTIONS_SETTLEMENT,
            );
        } else {
            $taxEnabled = Setting::getValue('ecommerce.tax_enabled', '1') === '1';
            $taxRate = (float) Setting::getValue('ecommerce.tax_rate', '11');
        }
        $amount = -1 * round((float) $award->amount, 2);

        $invoice = Invoice::query()->create([
            'code' => Invoice::nextCode(),
            'partner_id' => $award->partner_id,
            'status' => Invoice::STATUS_DRAFT,
            'issue_date' => now()->toDateString(),
            'due_date' => null,
            'tax_enabled' => $taxEnabled,
            'tax_rate' => $taxEnabled ? $taxRate : 0,
            'subtotal' => 0,
            'tax_amount' => 0,
            'total' => 0,
            'amount_paid' => 0,
            'notes' => __('promotions.messages.credit_from_award', [
                'program' => $award->program?->code ?? $award->trade_promo_program_id,
                'award' => $award->id,
            ]),
        ]);

        InvoiceLine::query()->create([
            'invoice_id' => $invoice->id,
            'description' => __('promotions.messages.credit_line_description', [
                'program' => $award->program?->name ?? ('#'.$award->trade_promo_program_id),
                'type' => $award->award_type,
            ]),
            'amount' => $amount,
            'source_type' => $award->getMorphClass(),
            'source_id' => $award->id,
        ]);

        $invoice->recalculate();
        $invoice->update(['status' => Invoice::STATUS_ISSUED]);

        if (class_exists(\Modules\Accounting\Support\AccountingBridge::class)) {
            \Modules\Accounting\Support\AccountingBridge::invoiceIssued($invoice->fresh());
        }

        return $invoice->fresh();
    }

    protected function createFreeGoodsSalesOrder(TradePromoAward $award): ?SalesOrder
    {
        if (! Modules::available('sales')
            || ! class_exists(SalesOrder::class)
            || ! Schema::hasTable('sales_orders')
            || ! Schema::hasTable('sales_order_items')) {
            return null;
        }

        $warehouseId = $this->defaultWarehouseId();
        if ($warehouseId === null) {
            return null;
        }

        $product = $award->freeProduct;
        if ($product === null) {
            return null;
        }

        $so = SalesOrder::query()->create([
            'partner_id' => $award->partner_id,
            'warehouse_id' => $warehouseId,
            'created_by' => auth()->id(),
            'so_number' => SalesOrder::nextNumber(),
            'status' => SalesOrder::STATUS_DRAFT,
            'ordered_at' => now()->toDateString(),
            'notes' => __('promotions.messages.so_from_free_goods_award', [
                'program' => $award->program?->code ?? $award->trade_promo_program_id,
                'award' => $award->id,
            ]),
            'total_amount' => 0,
            'discount_total' => 0,
        ]);

        $so->items()->create([
            'product_id' => $product->id,
            'quantity_ordered' => (float) $award->free_qty,
            'quantity_delivered' => 0,
            'unit_price' => 0,
            'line_discount' => 0,
            'unit' => $product->unit,
            'notes' => __('promotions.messages.free_goods_line'),
        ]);

        $so->recalculateTotal();

        return $so->fresh(['items']);
    }

    protected function defaultWarehouseId(): ?int
    {
        if (! class_exists(AccessibleWarehouses::class)) {
            return null;
        }

        $id = AccessibleWarehouses::query()
            ->where('status', 'active')
            ->salesOutbound()
            ->orderBy('name')
            ->value('id');

        return $id ? (int) $id : null;
    }
}
