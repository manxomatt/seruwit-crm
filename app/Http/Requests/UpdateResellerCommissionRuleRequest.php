<?php

namespace App\Http\Requests;

class UpdateResellerCommissionRuleRequest extends StoreResellerCommissionRuleRequest
{
    /**
     * Editing a rule uses the same shape as creating one; the scope fields are
     * simply not editable, so the controller ignores them on update.
     */
}
