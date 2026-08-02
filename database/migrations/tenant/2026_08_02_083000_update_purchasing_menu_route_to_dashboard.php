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
            ->where('slug', 'purchasing')
            ->where('route_name', 'purchasing.purchase-orders.index')
            ->update(['route_name' => 'purchasing.dashboard']);
    }

    public function down(): void
    {
        if (! Schema::hasTable('menus')) {
            return;
        }

        DB::table('menus')
            ->where('slug', 'purchasing')
            ->where('route_name', 'purchasing.dashboard')
            ->update(['route_name' => 'purchasing.purchase-orders.index']);
    }
};
