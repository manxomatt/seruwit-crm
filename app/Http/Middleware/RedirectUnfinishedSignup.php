<?php

namespace App\Http\Middleware;

use App\Actions\Auth\ResolvePostAuthDestination;
use Closure;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Keep self-serve signups on the verify → onboarding path until they have a workspace.
 *
 * Runs on the central domain only. Tenant domains are unaffected.
 *
 * Route names may be prefixed with `central.` when auth is loaded inside the
 * central domain group (CENTRAL_SERVES_APP=true).
 */
class RedirectUnfinishedSignup
{
    public function __construct(
        private readonly ResolvePostAuthDestination $destination,
    ) {}

    public function handle(Request $request, Closure $next): Response
    {
        if (tenancy()->initialized || ! ($user = $request->user())) {
            return $next($request);
        }

        if ($user instanceof MustVerifyEmail && ! $user->hasVerifiedEmail()) {
            if ($this->allowsUnverified($request)) {
                return $next($request);
            }

            return redirect()->route($this->routeName('verification.notice'));
        }

        if (! $this->destination->needsWorkspaceOnboarding($user)) {
            if ($this->matches($request, 'central.onboarding.*')) {
                return redirect()->to($this->destination->url($user));
            }

            return $next($request);
        }

        if ($this->allowsDuringOnboarding($request)) {
            return $next($request);
        }

        return redirect()->route('central.onboarding.show');
    }

    private function allowsUnverified(Request $request): bool
    {
        return $this->matches(
            $request,
            'verification.*',
            'logout',
            'password.*',
            'locale.update',
        );
    }

    private function allowsDuringOnboarding(Request $request): bool
    {
        return $this->matches(
            $request,
            'central.onboarding.*',
            'verification.*',
            'logout',
            'password.*',
            'profile.*',
            'locale.update',
        );
    }

    private function matches(Request $request, string ...$patterns): bool
    {
        foreach ($patterns as $pattern) {
            if ($request->routeIs($pattern)) {
                return true;
            }

            if (! str_starts_with($pattern, 'central.') && $request->routeIs('central.'.$pattern)) {
                return true;
            }
        }

        return false;
    }

    private function routeName(string $name): string
    {
        if (\Illuminate\Support\Facades\Route::has('central.'.$name)) {
            return 'central.'.$name;
        }

        return $name;
    }
}
