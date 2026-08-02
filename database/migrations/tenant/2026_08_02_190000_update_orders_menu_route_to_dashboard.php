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
            ->where('slug', 'orders')
            ->where('route_name', 'orders.index')
            ->update(['route_name' => 'orders.dashboard']);
    }

    public function down(): void
    {
        if (! Schema::hasTable('menus')) {
            return;
        }

        DB::table('menus')
            ->where('slug', 'orders')
            ->where('route_name', 'orders.dashboard')
            ->update(['route_name' => 'orders.index']);
    }
};
