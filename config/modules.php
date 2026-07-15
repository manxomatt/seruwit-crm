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
    | Purge Grace Period
    |--------------------------------------------------------------------------
    |
    | Uninstalling is non-destructive: the module's tables and data survive so a
    | reinstall restores everything. This is how many days that data is kept
    | before modules:purge-expired drops it for good.
    |
    */

    'purge_after_days' => 30,

];
