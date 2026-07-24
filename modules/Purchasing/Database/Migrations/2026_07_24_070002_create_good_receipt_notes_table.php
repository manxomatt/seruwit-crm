<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('good_receipt_notes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('purchase_order_id')->constrained('purchase_orders');
            $table->foreignId('warehouse_id')->constrained('warehouses');
            $table->foreignId('received_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('grn_number')->unique();
            $table->string('status')->default('draft')->index();
            $table->date('received_at');
            $table->string('supplier_do_number')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('good_receipt_note_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('good_receipt_note_id')->constrained('good_receipt_notes')->cascadeOnDelete();
            $table->foreignId('po_item_id')->constrained('purchase_order_items');
            $table->foreignId('location_id')->nullable()->constrained('warehouse_locations')->nullOnDelete();
            $table->decimal('quantity_received', 10, 2);
            $table->string('batch_number')->nullable();
            $table->date('expiry_date')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('good_receipt_note_items');
        Schema::dropIfExists('good_receipt_notes');
    }
};
