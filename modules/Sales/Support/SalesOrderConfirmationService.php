<?php

namespace Modules\Sales\Support;

use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Modules\Inventory\Support\StockReservationService;
use Modules\Receivables\Support\CreditLimitChecker;
use Modules\Sales\Models\SalesOrder;
use RuntimeException;

class SalesOrderConfirmationService
{
    public function confirm(SalesOrder $so): SalesOrder
    {
        return DB::transaction(function () use ($so) {
            $so = SalesOrder::query()->whereKey($so->id)->lockForUpdate()->firstOrFail();
            $so->load(['items.packaging', 'items.product', 'partner']);

            if ($so->status !== SalesOrder::STATUS_DRAFT) {
                throw new RuntimeException(__('sales.messages.so_confirm_draft_only'));
            }

            if ($so->items->isEmpty()) {
                throw new RuntimeException(__('sales.messages.so_confirm_need_items'));
            }

            SalesOrderItemLocker::lockItems($so->items->pluck('id')->all());

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

            try {
                StockReservationService::reserveSalesOrder($so);
            } catch (ValidationException $e) {
                $message = collect($e->errors())->flatten()->first()
                    ?? __('sales.messages.so_insufficient_stock_generic');

                throw new RuntimeException($message);
            }

            $so->update(['status' => SalesOrder::STATUS_CONFIRMED]);

            return $so->fresh(['items.product', 'partner', 'warehouse']);
        });
    }
}
