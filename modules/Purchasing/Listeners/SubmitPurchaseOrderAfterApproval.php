<?php

namespace Modules\Purchasing\Listeners;

use Modules\Approvals\Events\ApprovalCompleted;
use Modules\Approvals\Support\ApprovalTriggers;
use Modules\Purchasing\Models\PurchaseOrder;

class SubmitPurchaseOrderAfterApproval
{
    public function handle(ApprovalCompleted $event): void
    {
        $request = $event->request;

        if ($request->trigger_type !== ApprovalTriggers::PO_AMOUNT) {
            return;
        }

        $po = $request->subject;

        if (! $po instanceof PurchaseOrder) {
            return;
        }

        if ($po->status !== PurchaseOrder::STATUS_DRAFT) {
            return;
        }

        $po->update(['status' => PurchaseOrder::STATUS_SUBMITTED]);
    }
}
