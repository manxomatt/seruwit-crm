<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Registered Modules
    |--------------------------------------------------------------------------
    |
    | Optional features a tenant can install or uninstall. Order is irrelevant;
    | dependencies are declared by each module's requires() method.
    |
    | Core features (users, roles, settings, analytics, media) are deliberately
    | absent — they ship with every tenant and cannot be uninstalled.
    |
    */

    'registered' => [
        Modules\Billing\BillingModule::class,
        Modules\Carousels\CarouselsModule::class,
        Modules\Customer\CustomerModule::class,
        Modules\Fleet\FleetModule::class,
        Modules\Orders\OrdersModule::class,
        Modules\Pages\PagesModule::class,
        Modules\Posts\PostsModule::class,
        Modules\Product\ProductModule::class,
        Modules\TransportationManagement\TransportationManagementModule::class,
    ],

    /*
    |--------------------------------------------------------------------------
    | Subscription Plans
    |--------------------------------------------------------------------------
    |
    | Plans are not configured here — they live in the central `plans` table and
    | are edited from the super admin UI, since which modules a plan sells is a
    | commercial decision that moves faster than releases do.
    |
    | Read them through App\Modules\PlanRepository, never with a bare query:
    | entitlement is resolved from tenant context, where the connection points at
    | the tenant's schema and the central table is out of reach.
    |
    | Which modules *exist* is still code, below — that is the part a plan sells.
    |
    */

    /*
    |--------------------------------------------------------------------------
    | Purge Grace Period
    |--------------------------------------------------------------------------
    |
    | Uninstalling is non-destructive: the module's tables and data survive so a
    | reinstall restores everything. This is how many days that data is kept
    | before modules:purge-expired drops it for good.
    |
    | Losing entitlement — a downgrade — is not an uninstall and never starts this
    | clock. The module simply becomes unreachable, and upgrading brings it back
    | exactly as it was.
    |
    */

    'purge_after_days' => 30,

];
