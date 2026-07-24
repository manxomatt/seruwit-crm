<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('stock_levels', function (Blueprint $table) {
            $table->string('batch_number', 100)->default('')->after('location_id');
            $table->date('expiry_date')->nullable()->after('batch_number');
        });

        DB::table('stock_levels')->whereNull('batch_number')->update(['batch_number' => '']);

        Schema::table('stock_levels', function (Blueprint $table) {
            $table->dropUnique(['product_id', 'warehouse_id', 'location_id']);
            $table->unique(
                ['product_id', 'warehouse_id', 'location_id', 'batch_number'],
                'stock_levels_product_wh_loc_batch_unique'
            );
        });
    }

    public function down(): void
    {
        Schema::table('stock_levels', function (Blueprint $table) {
            $table->dropUnique('stock_levels_product_wh_loc_batch_unique');
        });

        Schema::table('stock_levels', function (Blueprint $table) {
            $table->dropColumn(['batch_number', 'expiry_date']);
            $table->unique(['product_id', 'warehouse_id', 'location_id']);
        });
    }
};
