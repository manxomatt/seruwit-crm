<?php

namespace App\Http\Middleware;

use App\Support\Reseller\ResellerAttribution;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Remember a ?ref= code for the rest of the visit.
 *
 * The code is not validated here on purpose: this runs on every request, and a
 * lookup per page view would buy nothing. Whether the code means anything is
 * decided once, at the moment a tenant is actually created.
 */
class CaptureResellerReferral
{
    public function handle(Request $request, Closure $next): Response
    {
        $code = $request->query('ref');

        if (! is_string($code) || trim($code) === '' || strlen($code) > 32) {
            return $next($request);
        }

        return $next($request)->withCookie(cookie(
            ResellerAttribution::COOKIE,
            strtoupper(trim($code)),
            ResellerAttribution::COOKIE_MINUTES,
        ));
    }
}
