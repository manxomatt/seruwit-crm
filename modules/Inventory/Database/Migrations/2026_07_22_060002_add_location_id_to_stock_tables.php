<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('stock_levels', function (Blueprint $table) {
            $table->foreignId('location_id')->nullable()->after('warehouse_id')
                ->constrained('warehouse_locations')->nullOnDelete();

            $table->dropUnique(['product_id', 'warehouse_id']);
            $table->unique(['product_id', 'warehouse_id', 'location_id']);
        });

        Schema::table('stock_movements', function (Blueprint $table) {
            $table->foreignId('location_id')->nullable()->after('warehouse_id')
                ->constrained('warehouse_locations')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('stock_movements', function (Blueprint $table) {
            $table->dropConstrainedForeignId('location_id');
        });

        Schema::table('stock_levels', function (Blueprint $table) {
            $table->dropUnique(['product_id', 'warehouse_id', 'location_id']);
            $table->dropConstrainedForeignId('location_id');
            $table->unique(['product_id', 'warehouse_id']);
        });
    }
};
