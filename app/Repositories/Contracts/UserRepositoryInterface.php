<?php

namespace App\Repositories\Contracts;

use App\Models\User;

interface UserRepositoryInterface
{
    /**
     * Update the last_login_at timestamp for the given user.
     */
    public function updateLastLogin(User $user): void;
}
