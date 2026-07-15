<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->web(append: [
            \App\Http\Middleware\HandleInertiaRequests::class,
            \Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets::class,
            \App\Http\Middleware\EnsureCentralUserCanAccessModule::class,
        ]);

        $middleware->alias([
            'permission' => \App\Http\Middleware\CheckPermission::class,
            // Named requires-module, not module, to stay clear of the unrelated
            // `module.` route-name prefix and `permissions.module` column.
            'requires-module' => \App\Http\Middleware\RequiresModule::class,
        ]);

        // Route model binding would otherwise resolve /module/carousels/{carousel}
        // by querying a table that does not exist when the module is uninstalled,
        // blowing up before the gate ever runs.
        $middleware->prependToPriorityList(
            \Illuminate\Routing\Middleware\SubstituteBindings::class,
            \App\Http\Middleware\RequiresModule::class,
        );
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();
