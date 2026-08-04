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
            ->where('slug', 'rental')
            ->where('route_name', 'rental.dashboard')
            ->update(['route_name' => 'rental.index']);
    }

    public function down(): void
    {
        if (! Schema::hasTable('menus')) {
            return;
        }

        DB::table('menus')
            ->where('slug', 'rental')
            ->where('route_name', 'rental.index')
            ->update(['route_name' => 'rental.dashboard']);
    }
};
