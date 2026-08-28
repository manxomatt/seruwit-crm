<?php

namespace App\Http\Middleware;

use App\Support\Installer\InstallState;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * First-run gate for the whole platform.
 *
 * Until the application is installed, every request is forced onto the
 * installer; once installed, the installer is sealed off for good. The check is
 * DB-free (InstallState reads a lock file), and this middleware is ordered ahead
 * of StartSession in the priority list so a fresh, un-migrated deployment
 * redirects to the installer instead of exploding in the database-backed session
 * or the Inertia prop sharing that follows.
 */
class EnsureApplicationInstalled
{
    public function handle(Request $request, Closure $next): Response
    {
        $onInstaller = $request->routeIs('install.*');

        if (InstallState::isInstalled()) {
            // One-shot: the installer never reopens once the platform is live.
            if ($onInstaller) {
                return redirect()->to('/');
            }

            return $next($request);
        }

        // The installer is only available for central / main domains.
        // Tenant requests must never be redirected to /install, and accessing
        // /install on a tenant domain 404s.
        if (tenancy()->initialized || ! $this->isCentralDomain($request)) {
            if ($onInstaller) {
                abort(404);
            }

            return $next($request);
        }

        if ($onInstaller) {
            return $next($request);
        }

        return redirect()->route('install.index');
    }

    private function isCentralDomain(Request $request): bool
    {
        $host = $request->getHost();
        $centralDomains = config('tenancy.central_domains', []);

        return in_array($host, $centralDomains, true);
    }
}
