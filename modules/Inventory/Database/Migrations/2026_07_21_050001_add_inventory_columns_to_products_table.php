<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->enum('category', ['merchandise', 'fleet_sparepart'])->default('merchandise')->after('status');
            $table->string('stock_unit')->nullable()->after('category');
            $table->integer('reorder_threshold')->default(10)->after('stock_unit');
            $table->integer('reorder_quantity')->default(50)->after('reorder_threshold');
            $table->unsignedBigInteger('warehouse_id')->nullable()->after('reorder_quantity');
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn(['category', 'stock_unit', 'reorder_threshold', 'reorder_quantity', 'warehouse_id']);
        });
    }
};
