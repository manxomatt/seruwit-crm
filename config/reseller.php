<?php

return [

    /*
     |--------------------------------------------------------------------------
     | Default Commission Rate
     |--------------------------------------------------------------------------
     | Last resort in the rate resolution chain: used when neither a matching
     | reseller_commission_rules row nor a reseller_profiles default applies.
     | `type` is percent|flat; percent values are whole percentages (10 = 10%).
     */
    'default_rate' => [
        'type' => env('RESELLER_DEFAULT_RATE_TYPE', 'percent'),
        'value' => (float) env('RESELLER_DEFAULT_RATE_VALUE', 10),
    ],

    /*
     |--------------------------------------------------------------------------
     | Renewal Commission Rate
     |--------------------------------------------------------------------------
     | Applied to renewal payments instead of default_rate. Set the value to 0
     | to make commissions first-payment-only.
     */
    'renewal_rate' => [
        'type' => env('RESELLER_RENEWAL_RATE_TYPE', 'percent'),
        'value' => (float) env('RESELLER_RENEWAL_RATE_VALUE', 5),
    ],

    /*
     |--------------------------------------------------------------------------
     | Hold Period
     |--------------------------------------------------------------------------
     | Days a freshly accrued commission stays `pending` before it may be
     | approved for payout. This is the refund window: voiding a commission is
     | cheap while it is pending and expensive once it has been paid out.
     */
    'hold_days' => (int) env('RESELLER_HOLD_DAYS', 7),

    /*
     |--------------------------------------------------------------------------
     | Attribution Lifetime
     |--------------------------------------------------------------------------
     | Months a tenant stays attributed to the reseller that brought it in.
     | Null means the attribution never expires. Stamped onto the tenant at
     | attribution time, so changing this never rewrites existing tenants.
     */
    'attribution_months' => env('RESELLER_ATTRIBUTION_MONTHS') !== null
        ? (int) env('RESELLER_ATTRIBUTION_MONTHS')
        : null,

];
