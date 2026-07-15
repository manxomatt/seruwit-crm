<?php

namespace App\Http\Middleware;

use App\Models\CentralUser;
use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureCentralUserCanAccessModule
{
    /**
     * Keep SaaS customers out of the central CRM module area.
     *
     * On the central domain, a user who belongs to one or more tenants (a SaaS
     * customer) but is not a central admin has no business in the central CRM —
     * their workspace lives on their tenant domain. Send them to the workspace
     * portal instead. Central staff (with a central role) and super admins are
     * unaffected; route-level permission checks handle the rest.
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (
            ! tenancy()->initialized
            && $request->is('module/*')
            && ($user = $request->user())
            && ! $user->isAdmin()
            && $this->belongsToAnyTenant($user)
        ) {
            return redirect()->route('central.workspaces.index');
        }

        return $next($request);
    }

    private function belongsToAnyTenant(User $user): bool
    {
        return CentralUser::query()
            ->where('global_id', $user->global_id)
            ->first()
            ?->tenants()
            ->exists() ?? false;
    }
}
