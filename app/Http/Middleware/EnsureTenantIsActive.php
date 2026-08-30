<?php

namespace App\Http\Middleware;

use App\Support\WorkspaceSuspendedPage;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureTenantIsActive
{
    /**
     * Block every request to a tenant whose status is not active.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (tenancy()->initialized) {
            $tenant = tenant();

            if ($tenant->status === 'suspended' || $tenant->status === 'cancelled') {
                if (! $this->isSubscriptionRoute($request)) {
                    return WorkspaceSuspendedPage::toResponse(
                        $request,
                        $tenant->name,
                        $tenant->domains->first()?->domain,
                        $tenant->id,
                        $tenant->is_trial_expired ?? false,
                    );
                }
            }
        }

        return $next($request);
    }

    private function isSubscriptionRoute(Request $request): bool
    {
        $route = $request->route();

        if (! $route) {
            return false;
        }

        $name = $route->getName();

        return $name !== null && (
            str_starts_with($name, 'module.subscription.') ||
            $name === 'module.subscription.index' ||
            $name === 'module.subscription.activate'
        );
    }
}
