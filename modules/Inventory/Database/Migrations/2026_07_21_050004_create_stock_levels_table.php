<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stock_levels', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->foreignId('warehouse_id')->constrained()->cascadeOnDelete();
            $table->decimal('on_hand', 10, 2)->default(0);
            $table->decimal('reserved', 10, 2)->default(0);
            $table->timestamp('updated_at');
            $table->unique(['product_id', 'warehouse_id']);
            $table->index(['on_hand', 'product_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_levels');
    }
};
