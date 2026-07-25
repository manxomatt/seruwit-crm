<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sales_orders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('partner_id')->constrained('partners');
            $table->foreignId('warehouse_id')->constrained('warehouses');
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('so_number')->unique();
            $table->string('status')->default('draft')->index();
            $table->date('ordered_at');
            $table->date('promised_at')->nullable();
            $table->text('notes')->nullable();
            $table->decimal('total_amount', 15, 2)->default(0);
            $table->timestamps();
        });

        Schema::create('sales_order_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sales_order_id')->constrained('sales_orders')->cascadeOnDelete();
            $table->foreignId('product_id')->constrained('products');
            $table->foreignId('product_packaging_id')->nullable()->constrained('product_packagings')->nullOnDelete();
            $table->decimal('quantity_ordered', 10, 2);
            $table->decimal('quantity_delivered', 10, 2)->default(0);
            $table->decimal('unit_price', 15, 2);
            $table->string('unit')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sales_order_items');
        Schema::dropIfExists('sales_orders');
    }
};
