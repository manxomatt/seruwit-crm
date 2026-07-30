<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Supported Locales
    |--------------------------------------------------------------------------
    |
    | First-phase languages. Keys must match lang/{locale} directories.
    |
    */

    'supported' => ['en', 'id'],

    /*
    |--------------------------------------------------------------------------
    | Default Locale
    |--------------------------------------------------------------------------
    |
    | Used when the user has no preference and the session has none. Defaults
    | to Indonesian to match the product's primary market; APP_LOCALE still
    | wins when explicitly set.
    |
    */

    'default' => env('APP_LOCALE', 'id'),

    /*
    |--------------------------------------------------------------------------
    | Session key
    |--------------------------------------------------------------------------
    */

    'session_key' => 'locale',

    /*
    |--------------------------------------------------------------------------
    | Translation groups shared with the Inertia frontend
    |--------------------------------------------------------------------------
    */

    'shared_groups' => [
        'shell',
        'common',
        'auth_ui',
        'modules',
        'menu_groups',
        'profile',
        'analytics',
        'central',
        'dashboard',
        'notifications',
        'fleet',
        'approvals',
        'bi',
        'billing',
        'blog',
        'canvassing',
        'carousels',
        'document',
        'inventory',
        'invoicing',
        'landing',
        'live_updates',
        'maintenance',
        'media',
        'orders',
        'outbound',
        'pos',
        'pages',
        'partners',
        'plans',
        'platform',
        'posts',
        'products',
        'promotions',
        'purchasing',
        'sales',
        'receivables',
        'payables',
        'accounting',
        'rental',
        'shuttle',
        'roles',
        'routing',
        'scoring',
        'settings',
        'tenants',
        'todos',
        'tracking',
        'transportation',
        'users',
    ],

];
