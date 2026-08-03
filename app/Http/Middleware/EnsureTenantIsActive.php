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
        if (tenancy()->initialized && tenant('status') !== 'active') {
            return WorkspaceSuspendedPage::toResponse($request);
        }

        return $next($request);
    }
}
