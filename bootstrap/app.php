<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Support\Facades\Route;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
        then: function (): void {
            // The installer runs before the database is migrated, so it cannot use
            // the web group (database-backed session/cache + Inertia prop sharing).
            // Its own lean "install" group carries only the first-run gate.
            Route::middleware('install')->group(__DIR__.'/../routes/install.php');
        },
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->web(
            prepend: [
                // First-run gate: redirects to the installer until the platform is
                // installed, and seals the installer off afterwards. Prepended, and
                // ordered ahead of StartSession below, so a fresh deployment never
                // reaches the database-backed session before being redirected.
                \App\Http\Middleware\EnsureApplicationInstalled::class,
            ],
            append: [
                \App\Http\Middleware\CaptureResellerReferral::class,
                \App\Http\Middleware\SetLocale::class,
                \App\Http\Middleware\HandleInertiaRequests::class,
                \Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets::class,
                \App\Http\Middleware\EnsureCentralUserCanAccessModule::class,
                \App\Http\Middleware\RedirectUnfinishedSignup::class,
            ],
        );

        // Middleware group for the installer. It carries session + CSRF so the
        // wizard forms work, but forces file-based session/cache first (via
        // ConfigureInstallerEnvironment) since the database-backed defaults have
        // no tables yet on a fresh deployment. It never includes the web group's
        // Inertia/tenancy appends, which query the not-yet-migrated database.
        $middleware->group('install', [
            \App\Http\Middleware\ConfigureInstallerEnvironment::class,
            \Illuminate\Cookie\Middleware\EncryptCookies::class,
            \Illuminate\Cookie\Middleware\AddQueuedCookiesToResponse::class,
            \Illuminate\Session\Middleware\StartSession::class,
            \Illuminate\View\Middleware\ShareErrorsFromSession::class,
            \Illuminate\Foundation\Http\Middleware\ValidateCsrfToken::class,
            \Illuminate\Routing\Middleware\SubstituteBindings::class,
            \App\Http\Middleware\EnsureApplicationInstalled::class,
            // Both need the session, so they sit after StartSession: the optional
            // token gate, then the lean Inertia layer that renders the wizard.
            \App\Http\Middleware\EnsureInstallerUnlocked::class,
            \App\Http\Middleware\HandleInstallerInertiaRequests::class,
        ]);

        // Run the gate and the installer's driver override before the
        // database-backed session starts, so an uninstalled deployment redirects
        // to (or serves) the installer instead of failing when StartSession
        // queries the not-yet-existing sessions table.
        $middleware->prependToPriorityList(
            \Illuminate\Session\Middleware\StartSession::class,
            \App\Http\Middleware\EnsureApplicationInstalled::class,
        );
        $middleware->prependToPriorityList(
            \Illuminate\Session\Middleware\StartSession::class,
            \App\Http\Middleware\ConfigureInstallerEnvironment::class,
        );

        $middleware->validateCsrfTokens(except: [
            'webhooks/midtrans',
            'api/mobile/*',
        ]);

        $middleware->alias([
            'permission' => \App\Http\Middleware\CheckPermission::class,
            // Named requires-module, not module, to stay clear of the unrelated
            // `module.` route-name prefix and `permissions.module` column.
            'requires-module' => \App\Http\Middleware\RequiresModule::class,
            'auth.mobile_passenger' => \Modules\Shuttle\Http\Middleware\AuthenticateMobilePassenger::class,
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
