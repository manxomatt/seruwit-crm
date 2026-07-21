<?php

namespace App\Support;

use App\Models\User;
use Illuminate\Support\Collection;

/**
 * Resolves which staff should receive an operational alert. There is no
 * "users who can do X" helper elsewhere, and every Phase 5 notifier needs the
 * same answer, so it lives here once.
 */
class NotificationRecipients
{
    /**
     * Users who may act on a given module/action: admins (who hold every
     * permission) plus anyone whose role carries that exact permission.
     *
     * @return Collection<int, User>
     */
    public static function forPermission(string $module, string $action): Collection
    {
        return User::query()
            ->where(function ($query) use ($module, $action) {
                $query->whereHas('roles', fn ($role) => $role->where('slug', 'admin'))
                    ->orWhereHas('roles.permissions', fn ($permission) => $permission
                        ->where('module', $module)
                        ->where('action', $action));
            })
            ->get();
    }
}
