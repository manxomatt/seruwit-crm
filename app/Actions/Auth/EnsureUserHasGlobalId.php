<?php

namespace App\Actions\Auth;

use App\Models\User;
use Illuminate\Support\Str;

/**
 * Heal platform identities that were created without a global_id.
 *
 * Onboarding, tenant pivots, and resource syncing all key off this UUID.
 * Central `users.global_id` is nullable for legacy rows, so callers that
 * require it should run this before writing related records.
 */
class EnsureUserHasGlobalId
{
    public function execute(User $user): User
    {
        if (filled($user->global_id)) {
            return $user;
        }

        $user->forceFill([
            'global_id' => (string) Str::uuid(),
        ])->save();

        return $user->refresh();
    }
}
