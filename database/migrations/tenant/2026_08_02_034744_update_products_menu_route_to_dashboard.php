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
            ->where('slug', 'products')
            ->where('route_name', 'products.index')
            ->update(['route_name' => 'products.dashboard']);
    }

    public function down(): void
    {
        if (! Schema::hasTable('menus')) {
            return;
        }

        DB::table('menus')
            ->where('slug', 'products')
            ->where('route_name', 'products.dashboard')
            ->update(['route_name' => 'products.index']);
    }
};
