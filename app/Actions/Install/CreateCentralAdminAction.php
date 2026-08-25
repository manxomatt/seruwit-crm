<?php

namespace App\Actions\Install;

use App\Models\Role;
use App\Models\User;
use RuntimeException;

/**
 * Creates the first platform admin from operator-supplied credentials — the
 * installer's replacement for the hard-coded DevAccountsSeeder admin. The account
 * is verified immediately (the operator is standing at the console) and assigned
 * the admin role, which gates every central management ability.
 */
class CreateCentralAdminAction
{
    /**
     * @param  array{name: string, email: string, password: string}  $data
     *
     * @throws RuntimeException when the admin role has not been bootstrapped yet
     */
    public function execute(array $data): User
    {
        $adminRole = Role::query()->where('slug', 'admin')->first();

        if ($adminRole === null) {
            throw new RuntimeException('The admin role is missing — run the platform bootstrap before creating the admin.');
        }

        $admin = new User;
        $admin->name = $data['name'];
        $admin->email = $data['email'];
        // Hashed by the model's 'password' cast.
        $admin->password = $data['password'];
        $admin->email_verified_at = now();
        $admin->save();

        $admin->assignRole($adminRole);

        return $admin;
    }
}
