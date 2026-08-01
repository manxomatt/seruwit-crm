<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('work_order_items', function (Blueprint $table) {
            // Soft links only: products/warehouses may be uninstalled. The
            // recorder resolves and validates at deduction time. Nullable so
            // off-catalog parts stay free-text and never touch inventory.
            $table->unsignedBigInteger('product_id')->nullable()->after('item_type');
            $table->unsignedBigInteger('warehouse_id')->nullable()->after('product_id');
        });

        Schema::table('work_orders', function (Blueprint $table) {
            // Set once stock has been drawn down for this work order, so a
            // re-saved completed order never double-deducts, and so a reopen
            // can reverse exactly what was taken.
            $table->timestamp('stock_deducted_at')->nullable()->after('completed_at');
        });
    }

    public function down(): void
    {
        Schema::table('work_order_items', function (Blueprint $table) {
            $table->dropColumn(['product_id', 'warehouse_id']);
        });

        Schema::table('work_orders', function (Blueprint $table) {
            $table->dropColumn('stock_deducted_at');
        });
    }
};
