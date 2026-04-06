<?php

use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // First, migrate existing users to the new RBAC system
        $users = DB::table('users')->get();
        $adminRole = Role::where('slug', 'admin')->first();
        $userRole = Role::where('slug', 'user')->first();

        foreach ($users as $user) {
            // Check if user already has roles assigned
            $existingRoles = DB::table('role_user')->where('user_id', $user->id)->count();

            if ($existingRoles === 0) {
                // Assign role based on old role column
                $roleToAssign = $user->role === 'admin' ? $adminRole : $userRole;

                if ($roleToAssign) {
                    DB::table('role_user')->insert([
                        'user_id' => $user->id,
                        'role_id' => $roleToAssign->id,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }
            }
        }

        // Then remove the old role column
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('role');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('role')->default('user');
        });

        // Restore old role values from role_user table
        $users = User::with('roles')->get();

        foreach ($users as $user) {
            $role = $user->roles->first();
            if ($role) {
                DB::table('users')
                    ->where('id', $user->id)
                    ->update(['role' => $role->slug]);
            }
        }
    }
};
