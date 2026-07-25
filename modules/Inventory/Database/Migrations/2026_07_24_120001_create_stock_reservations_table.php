<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Stock reservations link inventory to delivery orders. Inventory is Foundation
 * and must install without Orders (Vertical), so the delivery-order FKs are only
 * added when those tables already exist. Orders adds them later if Inventory
 * was installed first — see Orders migration add_stock_reservation_order_fks.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stock_reservations', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('delivery_order_id');
            $table->unsignedBigInteger('delivery_order_item_id');
            $table->foreignId('product_id')->constrained('products');
            $table->foreignId('warehouse_id')->constrained('warehouses');
            $table->foreignId('location_id')->nullable()->constrained('warehouse_locations')->nullOnDelete();
            $table->string('batch_number')->default('');
            $table->date('expiry_date')->nullable();
            $table->decimal('quantity', 12, 2);
            $table->decimal('consumed_quantity', 12, 2)->default(0);
            $table->string('status')->default('open')->index();
            $table->timestamps();

            $table->index(['delivery_order_id', 'status']);
            $table->index(['delivery_order_item_id', 'status']);
        });

        if (Schema::hasTable('delivery_orders') && Schema::hasTable('delivery_order_items')) {
            Schema::table('stock_reservations', function (Blueprint $table) {
                $table->foreign('delivery_order_id')
                    ->references('id')
                    ->on('delivery_orders')
                    ->cascadeOnDelete();
                $table->foreign('delivery_order_item_id')
                    ->references('id')
                    ->on('delivery_order_items')
                    ->cascadeOnDelete();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_reservations');
    }
};
