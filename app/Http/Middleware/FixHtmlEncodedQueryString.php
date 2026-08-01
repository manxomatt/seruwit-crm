<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Repair signed URLs copied from HTML email sources (e.g. laravel.log).
 *
 * HTML encodes "&" as "&amp;", so pasting the href into a browser yields
 * query keys like "amp;signature" and ValidateSignature returns 403.
 */
class FixHtmlEncodedQueryString
{
    public function handle(Request $request, Closure $next): Response
    {
        $uri = $request->getRequestUri();

        if (! str_contains($uri, '&amp;') && ! str_contains($uri, 'amp;signature=')) {
            return $next($request);
        }

        $fixed = html_entity_decode($uri, ENT_QUOTES | ENT_HTML5);

        if ($fixed === $uri) {
            return $next($request);
        }

        return redirect()->to($fixed);
    }
}
