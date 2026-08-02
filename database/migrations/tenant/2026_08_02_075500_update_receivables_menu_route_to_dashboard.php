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
            ->where('slug', 'receivables')
            ->where('route_name', 'receivables.payments.index')
            ->update(['route_name' => 'receivables.dashboard']);
    }

    public function down(): void
    {
        if (! Schema::hasTable('menus')) {
            return;
        }

        DB::table('menus')
            ->where('slug', 'receivables')
            ->where('route_name', 'receivables.dashboard')
            ->update(['route_name' => 'receivables.payments.index']);
    }
};
