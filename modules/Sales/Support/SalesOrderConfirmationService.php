<?php

namespace Modules\Sales\Support;

use Illuminate\Support\Facades\DB;
use Modules\Inventory\Models\StockLevel;
use Modules\Receivables\Support\CreditLimitChecker;
use Modules\Sales\Models\SalesOrder;
use RuntimeException;

class SalesOrderConfirmationService
{
    public function __construct(
        private GinConfirmationService $ginConfirmationService,
    ) {}

    public function confirm(SalesOrder $so): SalesOrder
    {
        return DB::transaction(function () use ($so) {
            $so->refresh();
            $so->load(['items.packaging', 'partner']);

            if ($so->status !== SalesOrder::STATUS_DRAFT) {
                throw new RuntimeException(__('sales.messages.so_confirm_draft_only'));
            }

            if ($so->items->isEmpty()) {
                throw new RuntimeException(__('sales.messages.so_confirm_need_items'));
            }

            $this->assertStockAvailable($so);

            $so->loadMissing('partner');

            $creditExceeded = class_exists(CreditLimitChecker::class)
                && CreditLimitChecker::wouldExceed($so->partner, (float) $so->total_amount);

            if ($creditExceeded) {
                if (class_exists(\Modules\Approvals\Support\ApprovalGate::class)) {
                    $gate = \Modules\Approvals\Support\ApprovalGate::authorize(
                        \Modules\Approvals\Support\ApprovalTriggers::CREDIT_LIMIT,
                        $so,
                        [
                            'amount' => (float) $so->total_amount,
                            'credit_exceeded' => true,
                            'partner_id' => $so->partner_id,
                            'resume' => 'sales.so.confirm',
                        ],
                    );

                    if (! $gate['allowed']) {
                        throw new RuntimeException($gate['message'] ?? __('sales.messages.so_credit_approval'));
                    }
                } else {
                    throw new RuntimeException(__('sales.messages.so_credit_exceeded'));
                }
            }

            $so->update(['status' => SalesOrder::STATUS_CONFIRMED]);

            return $so->fresh(['items.product', 'partner', 'warehouse']);
        });
    }

    public function availableBaseQuantity(int $productId, int $warehouseId): float
    {
        return round((float) StockLevel::query()
            ->where('product_id', $productId)
            ->where('warehouse_id', $warehouseId)
            ->get(['on_hand', 'reserved'])
            ->sum(fn (StockLevel $level): float => (float) $level->on_hand - (float) $level->reserved), 2);
    }

    public function assertStockAvailable(SalesOrder $so): void
    {
        foreach ($so->items as $item) {
            $needed = $this->ginConfirmationService->toBaseQuantity((float) $item->quantity_ordered, $item);
            $available = $this->availableBaseQuantity((int) $item->product_id, (int) $so->warehouse_id);

            if ($needed > $available + 0.009) {
                throw new RuntimeException(__('sales.messages.so_insufficient_stock', [
                    'product' => $item->product?->name ?? (string) $item->product_id,
                    'needed' => $needed,
                    'available' => $available,
                ]));
            }
        }
    }
}
