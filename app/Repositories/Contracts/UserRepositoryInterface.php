<?php

namespace App\Repositories\Contracts;

use App\DTOs\ExternalUserData;
use App\Models\User;

interface UserRepositoryInterface
{
    /**
     * Sync a user from an external system into the local database.
     * Creates the user if they do not exist; updates otherwise.
     * Never overwrites an existing local password.
     */
    public function syncFromExternal(ExternalUserData $data): User;

    /**
     * Update the last_login_at timestamp for the given user.
     */
    public function updateLastLogin(User $user): void;
}
