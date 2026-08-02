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
            ->where('slug', 'partners')
            ->where('route_name', 'partners.index')
            ->update(['route_name' => 'partners.dashboard']);
    }

    public function down(): void
    {
        if (! Schema::hasTable('menus')) {
            return;
        }

        DB::table('menus')
            ->where('slug', 'partners')
            ->where('route_name', 'partners.dashboard')
            ->update(['route_name' => 'partners.index']);
    }
};
