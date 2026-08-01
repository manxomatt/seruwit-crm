<?php

namespace Modules\Shuttle\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

class MobileApiHeaders
{
    /**
     * @param  Closure(Request): Response  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $requestId = $request->header('X-Request-Id') ?: (string) Str::uuid();

        /** @var Response $response */
        $response = $next($request);

        $response->headers->set('X-Api-Version', '1');
        $response->headers->set('X-Request-Id', $requestId);

        return $response;
    }
}
