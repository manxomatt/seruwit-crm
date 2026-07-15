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
        Modules\Carousels\CarouselsModule::class,
    ],

    /*
    |--------------------------------------------------------------------------
    | Subscription Plans
    |--------------------------------------------------------------------------
    |
    | Which modules each plan entitles a tenant to install. Entitlement ("may I
    | have it") and installation ("did I take it") are separate: a plan opens the
    | door, the tenant's own admin decides whether to walk through.
    |
    | Plans live in config rather than a table on purpose. A tenant's plan is a
    | virtual column on its `data` JSON, so it is already loaded with the tenant
    | on every request — resolving entitlement costs no query at all, where a
    | central table would mean a cross-schema lookup per request. Plan contents
    | are a product decision that changes on release, not at runtime.
    |
    | The default is what every tenant without an explicit plan falls back to,
    | including every tenant that existed before plans did — so it must cover what
    | they already have, or introducing plans would quietly take modules away.
    |
    */

    'default_plan' => 'basic',

    'plans' => [

        'free' => [
            'label' => 'Free',
            'description' => 'CMS inti saja, tanpa modul tambahan.',
            'modules' => [],
        ],

        'basic' => [
            'label' => 'Basic',
            'description' => 'CMS inti plus carousel untuk halaman publik.',
            'modules' => ['carousels'],
        ],

        'pro' => [
            'label' => 'Pro',
            'description' => 'Seluruh modul yang tersedia.',
            'modules' => ['carousels'],
        ],

    ],

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
