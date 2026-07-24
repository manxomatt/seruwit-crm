<?php

namespace Modules\Orders\Listeners;

use Illuminate\Support\Facades\DB;
use Modules\Approvals\Events\ApprovalCompleted;
use Modules\Approvals\Support\ApprovalTriggers;
use Modules\Orders\Models\DeliveryOrder;
use Modules\Orders\Support\DeliveryOrderStock;

class ConfirmDeliveryOrderAfterApproval
{
    public function handle(ApprovalCompleted $event): void
    {
        $request = $event->request;

        if (! in_array($request->trigger_type, [ApprovalTriggers::ORDER_DISCOUNT, ApprovalTriggers::ORDER_SLA], true)) {
            return;
        }

        $order = $request->subject;

        if (! $order instanceof DeliveryOrder) {
            return;
        }

        if ($order->status !== DeliveryOrder::STATUS_DRAFT) {
            return;
        }

        // Re-check the other trigger isn't still pending
        if ($this->hasOtherPending($order, $request->trigger_type)) {
            return;
        }

        DB::transaction(function () use ($order): void {
            DeliveryOrderStock::reserve($order);
            $order->update([
                'status' => DeliveryOrder::STATUS_CONFIRMED,
                'confirmed_at' => now(),
            ]);
        });
    }

    private function hasOtherPending(DeliveryOrder $order, string $currentTrigger): bool
    {
        if (! class_exists(\Modules\Approvals\Models\ApprovalRequest::class)) {
            return false;
        }

        return \Modules\Approvals\Models\ApprovalRequest::query()
            ->where('subject_type', $order->getMorphClass())
            ->where('subject_id', $order->id)
            ->where('status', \Modules\Approvals\Models\ApprovalRequest::STATUS_PENDING)
            ->where('trigger_type', '!=', $currentTrigger)
            ->exists();
    }
}
