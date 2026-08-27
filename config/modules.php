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
        // Content/CMS modules every workspace (central + tenant) gets automatically.
        // Their migrations live in database/migrations(+ /tenant), like the other
        // core modules — never in modules/*/Database/Migrations.
        Modules\Pages\PagesModule::class,
        Modules\Posts\PostsModule::class,
        Modules\Carousels\CarouselsModule::class,
    ],

    'registered' => [
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
        // Dashboard
        'bi',

        // Finance
        'accounting',
        'payment-orders',

        // Contents (pages/posts/carousels are now core → migrated by the base
        // central migration, so they no longer need an explicit central install)
        'document',

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
    | Optional modules (from `registered` above) the super admin may install onto
    | the Central Admin dashboard itself, à la carte, from the central module
    | marketplace. Unlike `central_modules` — which are always on and provisioned
    | by CentralMigrator — these are installed and uninstalled on demand, tracked
    | in the central `installed_modules` table exactly like a tenant install.
    |
    | This is a curated allowlist, not the whole `registered` list, because a
    | module is only safe to install on central when its migrations reference only
    | its own tables or core central tables (users, media, partners) — never a
    | tenant-only table. Verify that before adding a key here.
    |
    */
    'central_installable' => [
        'fleet',
    ],

];
