<?php

namespace App\Repositories;

use App\Models\User;
use App\Repositories\Contracts\UserRepositoryInterface;

class UserRepository implements UserRepositoryInterface
{
    /**
     * Stamp the user's last login timestamp.
     */
    public function updateLastLogin(User $user): void
    {
        $user->update(['last_login_at' => now()]);
    }
}
