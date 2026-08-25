<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Makes the installer usable on an un-migrated deployment.
 *
 * The default session and cache stores are database-backed, but their tables do
 * not exist yet during first-run installation. This forces file-based stores for
 * installer requests so forms (session + CSRF) work before migrations run. It is
 * ordered ahead of StartSession in the priority list, and only ever runs inside
 * the lean "install" middleware group — normal requests are untouched.
 */
class ConfigureInstallerEnvironment
{
    public function handle(Request $request, Closure $next): Response
    {
        config([
            'session.driver' => 'file',
            'cache.default' => 'file',
        ]);

        return $next($request);
    }
}
