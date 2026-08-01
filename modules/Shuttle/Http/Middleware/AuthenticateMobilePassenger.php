<?php

namespace Modules\Shuttle\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Modules\Shuttle\Support\MobilePassengerTokenService;
use Symfony\Component\HttpFoundation\Response;

class AuthenticateMobilePassenger
{
    public function __construct(
        private readonly MobilePassengerTokenService $tokens,
    ) {}

    /**
     * @param  Closure(Request): Response  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $plain = (string) $request->bearerToken();
        $row = $this->tokens->findValid($plain);

        if ($row === null) {
            return response()->json([
                'message' => 'Unauthenticated.',
                'code' => 'unauthenticated',
            ], Response::HTTP_UNAUTHORIZED);
        }

        $request->attributes->set('mobile_passenger_phone', $row->phone);

        return $next($request);
    }
}
