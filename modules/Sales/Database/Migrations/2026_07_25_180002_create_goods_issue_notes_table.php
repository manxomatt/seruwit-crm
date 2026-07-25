<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('goods_issue_notes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sales_order_id')->constrained('sales_orders');
            $table->foreignId('warehouse_id')->constrained('warehouses');
            $table->foreignId('issued_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('gin_number')->unique();
            $table->string('status')->default('draft')->index();
            $table->date('issued_at');
            $table->string('delivery_note_number')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('goods_issue_note_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('goods_issue_note_id')->constrained('goods_issue_notes')->cascadeOnDelete();
            $table->foreignId('so_item_id')->constrained('sales_order_items');
            $table->foreignId('location_id')->nullable()->constrained('warehouse_locations')->nullOnDelete();
            $table->decimal('quantity_issued', 10, 2);
            $table->string('batch_number')->nullable();
            $table->date('expiry_date')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('goods_issue_note_items');
        Schema::dropIfExists('goods_issue_notes');
    }
};
