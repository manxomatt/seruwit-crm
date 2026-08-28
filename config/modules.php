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
    | Core features (users, roles, settings, analytics, media, partners,
    | accounting) are deliberately absent — they ship with every tenant and
    | cannot be uninstalled. Partners and Accounting still live under
    | modules/ for code organization; they are wired via the `core` list below.
    |
    */

    'core' => [
        Modules\Partners\PartnersModule::class,
        Modules\Accounting\AccountingModule::class,
    ],

    'registered' => [
        Modules\Pages\PagesModule::class,
        Modules\Posts\PostsModule::class,
        Modules\Carousels\CarouselsModule::class,
        Modules\Billing\BillingModule::class,
        Modules\Document\DocumentModule::class,
        Modules\Fleet\FleetModule::class,
        Modules\Inventory\InventoryModule::class,
        Modules\Invoicing\InvoicingModule::class,
        Modules\Purchasing\PurchasingModule::class,
        Modules\Sales\SalesModule::class,
        Modules\Receivables\ReceivablesModule::class,
        Modules\Payables\PayablesModule::class,
        Modules\Approvals\ApprovalsModule::class,
        Modules\DriverScoring\DriverScoringModule::class,
        Modules\TradePromotions\TradePromotionsModule::class,
        Modules\ExecutiveDashboard\ExecutiveDashboardModule::class,
        Modules\Outbound\OutboundModule::class,
        Modules\Pos\PosModule::class,
        Modules\Routing\RoutingModule::class,
        Modules\Maintenance\MaintenanceModule::class,
        Modules\Orders\OrdersModule::class,
        Modules\Product\ProductModule::class,
        Modules\Tracking\TrackingModule::class,
        Modules\TransportationManagement\TransportationManagementModule::class,
        Modules\Rental\RentalModule::class,
        Modules\Shuttle\ShuttleModule::class,
        Modules\Canvassing\CanvassingModule::class,
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

    /*
    |--------------------------------------------------------------------------
    | Central Admin Allowed Modules
    |--------------------------------------------------------------------------
    |
    | Modules accessible when operating on the Central Admin domain.
    | Grouped into: Dashboard, Finance, Contents, Platform.
    |
    */
    'central_modules' => [
        // Finance
        'accounting',
        'payment-orders',

        // Administration
        'users',
        'roles',

        // Platform
        'tenants',
        'plans',
        'registry',
        'settings',
    ],

    /*
    |--------------------------------------------------------------------------
    | Central-Installable Optional Modules
    |--------------------------------------------------------------------------
    |
    | Optional modules the super admin may install onto the Central Admin
    | dashboard itself, à la carte, from the central module marketplace. Unlike
    | `central_modules` — which are always on and provisioned by CentralMigrator —
    | these are installed and uninstalled on demand, tracked in the central
    | `installed_modules` table exactly like a tenant install.
    |
    | 'all' (the default) makes every `registered` module above installable on
    | central, so the marketplace mirrors what a tenant can install. Replace it
    | with an explicit array of keys to curate the list instead. Either way the
    | always-on `central_modules` are excluded — they need no install.
    |
    | Caveat: a module only installs cleanly on central when its migrations touch
    | only its own tables or core central tables (users, media, partners). One
    | that references a tenant-only table fails the install with a flash error
    | rather than crashing; curate it out here if that happens.
    |
    | Resolved through App\Modules\ModuleRegistry::centralInstallable(), the single
    | source of truth read by the catalog, routes, controller and sidebar.
    |
    */
    'central_installable' => 'all',

];
