<?php

namespace App\Http\Middleware;

use App\Models\PlatformSetting;
use App\Models\Setting;
use App\Support\MaintenanceModePage;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class CheckMaintenanceMode
{
    /**
     * Intercept public requests when maintenance mode is enabled.
     * Platform maintenance mode applies globally across central and all tenants.
     * Authenticated administrators retain access to management panels.
     */
    public function handle(Request $request, Closure $next): Response
    {
        // 1. Never block installer or health check
        if ($request->is('up', 'install', 'install/*')) {
            return $next($request);
        }

        // 2. Safe check if maintenance mode is enabled
        try {
            if (tenancy()->initialized) {
                $isGlobalTenantLock = PlatformSetting::isTenantMaintenanceMode();
                $isLocalTenantMaintenance = Setting::getValue('general.maintenance_mode') === '1';
                $isMaintenance = $isGlobalTenantLock || $isLocalTenantMaintenance;
            } else {
                $isGlobalTenantLock = false;
                $isMaintenance = PlatformSetting::isMaintenanceMode() || Setting::getValue('general.maintenance_mode') === '1';
            }
        } catch (\Throwable) {
            return $next($request);
        }

        if (! $isMaintenance) {
            return $next($request);
        }

        // 3. When Central Superadmin locks all tenant domains globally, block all tenant traffic
        // except essential webhooks and logout.
        if ($isGlobalTenantLock) {
            if ($request->is('logout', 'webhooks/*')) {
                return $next($request);
            }

            return MaintenanceModePage::toResponse($request);
        }

        // 4. Allow authenticated staff / admin users on the web guard
        if (Auth::guard('web')->check()) {
            return $next($request);
        }

        // 5. Allow authentication, password reset, and essential routes so staff can log in
        if ($this->isExemptRoute($request)) {
            return $next($request);
        }

        // 6. Render Maintenance Mode 503 response
        return MaintenanceModePage::toResponse($request);
    }

    /**
     * Determine if the request matches an exempt route.
     */
    protected function isExemptRoute(Request $request): bool
    {
        if ($request->is(
            'login',
            'logout',
            'password/*',
            'two-factor/*',
            'webhooks/*',
            'api/mobile/*',
            'impersonate/*',
        )) {
            return true;
        }

        $route = $request->route();
        if (! $route) {
            return false;
        }

        $name = $route->getName();
        if (! $name) {
            return false;
        }

        return in_array($name, [
            'login',
            'logout',
            'tenant.impersonate',
            'password.request',
            'password.email',
            'password.reset',
            'password.store',
            'password.confirm',
            'webhooks.payment',
        ], true) || str_starts_with($name, 'password.');
    }
}
