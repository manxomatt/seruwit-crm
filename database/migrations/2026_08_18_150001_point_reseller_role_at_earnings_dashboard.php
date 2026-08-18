<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Resellers now land on their earnings portal instead of the tenant list.
 *
 * The role definition in SystemRolePermissions only applies when a role is
 * first created, so existing rows need moving by hand.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('roles')) {
            return;
        }

        DB::table('roles')
            ->where('slug', 'reseller')
            ->where('dashboard_path', '/module/tenants')
            ->update(['dashboard_path' => '/module/reseller/dashboard']);
    }

    public function down(): void
    {
        if (! Schema::hasTable('roles')) {
            return;
        }

        DB::table('roles')
            ->where('slug', 'reseller')
            ->where('dashboard_path', '/module/reseller/dashboard')
            ->update(['dashboard_path' => '/module/tenants']);
    }
};
