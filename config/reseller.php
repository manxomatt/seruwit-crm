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
     | Minimum Payout
     |--------------------------------------------------------------------------
     | Platform-wide floor for a payout batch. A reseller whose approved
     | commissions do not reach it simply rolls over into the next period —
     | nothing is lost, it is just not worth a transfer fee yet. A per-reseller
     | value on the profile overrides this.
     */
    'minimum_payout' => (float) env('RESELLER_MINIMUM_PAYOUT', 100000),

    /*
     |--------------------------------------------------------------------------
     | Withholding Tax
     |--------------------------------------------------------------------------
     | Indonesian PPh on reseller fees. The rate depends on whether the partner
     | has an NPWP on file; without one the statutory rate is higher. Computed
     | and frozen at accrual, so a later NPWP change never re-prices fees that
     | were already earned.
     */
    'withholding' => [
        'enabled' => (bool) env('RESELLER_WITHHOLDING_ENABLED', false),
        'with_npwp' => (float) env('RESELLER_WITHHOLDING_WITH_NPWP', 2),
        'without_npwp' => (float) env('RESELLER_WITHHOLDING_WITHOUT_NPWP', 4),
    ],

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
