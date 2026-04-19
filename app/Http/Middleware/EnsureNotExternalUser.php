<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureNotExternalUser
{
    /**
     * Redirect users with an external role away from the local CMS module area.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user && $user->getPrimaryRole()?->slug && str_starts_with($user->getPrimaryRole()->slug, 'external_')) {
            return redirect()->route('external.dashboard');
        }

        return $next($request);
    }
}
