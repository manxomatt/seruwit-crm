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
            ->where('slug', 'payables')
            ->where('route_name', 'payables.bills.index')
            ->update(['route_name' => 'payables.dashboard']);
    }

    public function down(): void
    {
        if (! Schema::hasTable('menus')) {
            return;
        }

        DB::table('menus')
            ->where('slug', 'payables')
            ->where('route_name', 'payables.dashboard')
            ->update(['route_name' => 'payables.bills.index']);
    }
};
