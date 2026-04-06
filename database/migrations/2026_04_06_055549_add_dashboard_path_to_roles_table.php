<?php

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
        Schema::table('roles', function (Blueprint $table) {
            $table->string('dashboard_path')->nullable()->after('description');
        });

        // Set default dashboard paths for existing roles
        DB::table('roles')->where('slug', 'admin')->update(['dashboard_path' => '/admin/dashboard']);
        DB::table('roles')->where('slug', 'user')->update(['dashboard_path' => '/user/dashboard']);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('roles', function (Blueprint $table) {
            $table->dropColumn('dashboard_path');
        });
    }
};
