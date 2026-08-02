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
            ->where('slug', 'transportation')
            ->where('route_name', 'transportation.trips.index')
            ->update(['route_name' => 'transportation.dashboard']);
    }

    public function down(): void
    {
        if (! Schema::hasTable('menus')) {
            return;
        }

        DB::table('menus')
            ->where('slug', 'transportation')
            ->where('route_name', 'transportation.dashboard')
            ->update(['route_name' => 'transportation.trips.index']);
    }
};
