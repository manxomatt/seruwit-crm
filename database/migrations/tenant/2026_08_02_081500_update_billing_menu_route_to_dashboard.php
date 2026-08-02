<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('menus')) {
            return;
        }

        DB::table('menus')
            ->where('slug', 'billing')
            ->where('route_name', 'billing.charges.index')
            ->update(['route_name' => 'billing.dashboard']);
    }

    public function down(): void
    {
        if (! Schema::hasTable('menus')) {
            return;
        }

        DB::table('menus')
            ->where('slug', 'billing')
            ->where('route_name', 'billing.dashboard')
            ->update(['route_name' => 'billing.charges.index']);
    }
};
