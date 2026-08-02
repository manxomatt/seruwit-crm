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
            ->where('slug', 'invoicing')
            ->where('route_name', 'invoicing.invoices.index')
            ->update(['route_name' => 'invoicing.dashboard']);
    }

    public function down(): void
    {
        if (! Schema::hasTable('menus')) {
            return;
        }

        DB::table('menus')
            ->where('slug', 'invoicing')
            ->where('route_name', 'invoicing.dashboard')
            ->update(['route_name' => 'invoicing.invoices.index']);
    }
};
