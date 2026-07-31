<?php

namespace App\Actions\Auth;

use App\Models\CentralUser;
use App\Models\User;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Support\Facades\Route;

/**
 * Where an authenticated central-domain user should land next.
 */
class ResolvePostAuthDestination
{
    public function url(User $user): string
    {
        if ($user instanceof MustVerifyEmail && ! $user->hasVerifiedEmail()) {
            return route($this->routeName('verification.notice'), absolute: false);
        }

        if ($this->needsWorkspaceOnboarding($user)) {
            return route('central.onboarding.show', absolute: false);
        }

        if ($this->belongsToAnyTenant($user) && ! $user->roles()->exists()) {
            return route('central.workspaces.index', absolute: false);
        }

        return $user->getDashboardPath();
    }

    /**
     * Verified self-serve user with no workspace yet (and not platform staff).
     *
     * Platform staff carry roles on the central users table. SaaS customers
     * keep roles tenant-local, so an empty central role set + no tenants
     * means they still need workspace onboarding.
     */
    public function needsWorkspaceOnboarding(User $user): bool
    {
        if ($user instanceof MustVerifyEmail && ! $user->hasVerifiedEmail()) {
            return false;
        }

        if ($user->roles()->exists()) {
            return false;
        }

        return ! $this->belongsToAnyTenant($user);
    }

    public function belongsToAnyTenant(User $user): bool
    {
        return CentralUser::query()
            ->where('global_id', $user->global_id)
            ->first()
            ?->tenants()
            ->exists() ?? false;
    }

    private function routeName(string $name): string
    {
        if (Route::has('central.'.$name)) {
            return 'central.'.$name;
        }

        return $name;
    }
}
