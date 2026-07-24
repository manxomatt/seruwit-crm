<?php

namespace Modules\Invoicing\Listeners;

use Modules\Approvals\Events\ApprovalCompleted;
use Modules\Approvals\Support\ApprovalTriggers;
use Modules\Invoicing\Models\Invoice;

class IssueInvoiceAfterApproval
{
    public function handle(ApprovalCompleted $event): void
    {
        $request = $event->request;

        if ($request->trigger_type !== ApprovalTriggers::CREDIT_LIMIT) {
            return;
        }

        $invoice = $request->subject;

        if (! $invoice instanceof Invoice) {
            return;
        }

        if ($invoice->status !== Invoice::STATUS_DRAFT) {
            return;
        }

        if (! $invoice->lines()->exists()) {
            return;
        }

        $invoice->update(['status' => Invoice::STATUS_ISSUED]);
    }
}
