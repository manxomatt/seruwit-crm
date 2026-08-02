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
            ->where('slug', 'inventory')
            ->where('route_name', 'inventory.warehouses.index')
            ->update(['route_name' => 'inventory.dashboard']);
    }

    public function down(): void
    {
        if (! Schema::hasTable('menus')) {
            return;
        }

        DB::table('menus')
            ->where('slug', 'inventory')
            ->where('route_name', 'inventory.dashboard')
            ->update(['route_name' => 'inventory.warehouses.index']);
    }
};
