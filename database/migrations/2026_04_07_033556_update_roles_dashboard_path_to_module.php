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
        // Update all roles to use /module/dashboard
        DB::table('roles')
            ->where('dashboard_path', '/dashboard')
            ->orWhereNull('dashboard_path')
            ->update(['dashboard_path' => '/module/dashboard']);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert back to /dashboard
        DB::table('roles')
            ->where('dashboard_path', '/module/dashboard')
            ->update(['dashboard_path' => '/dashboard']);
    }
};
