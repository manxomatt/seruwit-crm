<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Update all roles to use /dashboard as the dashboard path
        DB::table('roles')->update(['dashboard_path' => '/dashboard']);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Restore original dashboard paths for system roles
        DB::table('roles')->where('slug', 'admin')->update(['dashboard_path' => '/admin/dashboard']);
        DB::table('roles')->where('slug', 'user')->update(['dashboard_path' => '/user/dashboard']);
        DB::table('roles')->whereNotIn('slug', ['admin', 'user'])->update(['dashboard_path' => null]);
    }
};
