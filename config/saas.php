<?php

return [

    /*
     |--------------------------------------------------------------------------
     | Operator Tenant ID
     |--------------------------------------------------------------------------
     | The tenant that operates this SaaS platform. When set, confirmed
     | subscription payments are posted as journal entries (Dr bank /
     | Cr saas_revenue) into this tenant's Accounting module.
     |
     | When left null or set to 'central', subscription payments are posted
     | directly into the Admin Central Accounting system.
     |
     | Required accounts in the chart of accounts:
     |   system_role = 'bank'          (or 'cash' as fallback) — asset account
     |   system_role = 'saas_revenue'  — revenue account for SaaS income
     |   system_role = 'cash_variance' — for the transfer unique-code delta
     */
    'operator_tenant_id' => env('SAAS_OPERATOR_TENANT_ID'),

];
