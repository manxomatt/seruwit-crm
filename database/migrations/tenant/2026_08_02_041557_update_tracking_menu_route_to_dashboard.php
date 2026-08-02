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
            ->where('slug', 'tracking')
            ->where('route_name', 'tracking.map')
            ->update(['route_name' => 'tracking.dashboard']);
    }

    public function down(): void
    {
        if (! Schema::hasTable('menus')) {
            return;
        }

        DB::table('menus')
            ->where('slug', 'tracking')
            ->where('route_name', 'tracking.dashboard')
            ->update(['route_name' => 'tracking.map']);
    }
};
