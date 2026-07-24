<?php

namespace Modules\Approvals\Events;

use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use Modules\Approvals\Models\ApprovalRequest;

class ApprovalCompleted
{
    use Dispatchable, SerializesModels;

    public function __construct(public ApprovalRequest $request) {}
}
