<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pick_lists', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->foreignId('delivery_order_id')->constrained('delivery_orders');
            $table->foreignId('warehouse_id')->constrained('warehouses');
            $table->string('status')->default('open')->index();
            $table->foreignId('generated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('generated_at')->nullable();
            $table->timestamp('picked_at')->nullable();
            $table->timestamp('packed_at')->nullable();
            $table->timestamp('dispatched_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['delivery_order_id', 'status']);
        });

        Schema::create('pick_list_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pick_list_id')->constrained('pick_lists')->cascadeOnDelete();
            $table->foreignId('delivery_order_item_id')->constrained('delivery_order_items')->cascadeOnDelete();
            $table->foreignId('product_id')->constrained('products');
            $table->decimal('quantity_requested', 12, 2);
            $table->decimal('quantity_picked', 12, 2)->default(0);
            $table->foreignId('suggested_location_id')->nullable()->constrained('warehouse_locations')->nullOnDelete();
            $table->string('suggested_batch_number')->nullable();
            $table->date('suggested_expiry_date')->nullable();
            $table->foreignId('location_id')->nullable()->constrained('warehouse_locations')->nullOnDelete();
            $table->string('batch_number')->nullable();
            $table->date('expiry_date')->nullable();
            $table->string('status')->default('pending')->index();
            $table->foreignId('picked_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('picked_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('packs', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->string('label_code')->unique();
            $table->foreignId('pick_list_id')->constrained('pick_lists')->cascadeOnDelete();
            $table->string('status')->default('open')->index();
            $table->foreignId('packed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('packed_at')->nullable();
            $table->timestamp('sealed_at')->nullable();
            $table->decimal('weight_kg', 10, 2)->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('pack_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pack_id')->constrained('packs')->cascadeOnDelete();
            $table->foreignId('pick_list_item_id')->constrained('pick_list_items')->cascadeOnDelete();
            $table->decimal('quantity', 12, 2);
            $table->timestamps();

            $table->unique(['pack_id', 'pick_list_item_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pack_items');
        Schema::dropIfExists('packs');
        Schema::dropIfExists('pick_list_items');
        Schema::dropIfExists('pick_lists');
    }
};
