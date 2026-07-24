<?php

namespace Modules\Approvals\Support;

class ConditionMatcher
{
    /**
     * @param  array<string, mixed>  $conditions
     * @param  array<string, mixed>  $payload
     */
    public static function matches(array $conditions, array $payload): bool
    {
        if ($conditions === []) {
            return true;
        }

        if (isset($conditions['min_amount'])) {
            $amount = (float) ($payload['amount'] ?? 0);
            if ($amount + 0.009 < (float) $conditions['min_amount']) {
                return false;
            }
        }

        if (array_key_exists('requires_exceeded', $conditions) && $conditions['requires_exceeded']) {
            if (! ($payload['credit_exceeded'] ?? false)) {
                return false;
            }
        }

        if (isset($conditions['min_discount_percent'])) {
            $discount = (float) ($payload['discount_percent'] ?? 0);
            if ($discount + 0.009 < (float) $conditions['min_discount_percent']) {
                return false;
            }
        }

        if (isset($conditions['max_lead_hours'])) {
            $leadHours = $payload['lead_hours'] ?? null;
            if ($leadHours === null) {
                return false;
            }
            // Outside SLA = promised sooner than the configured minimum lead time
            if ((float) $leadHours + 0.009 >= (float) $conditions['max_lead_hours']) {
                return false;
            }
        }

        return true;
    }
}
