<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('pod_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('proof_of_delivery_id')->constrained()->cascadeOnDelete();
            $table->foreignId('delivery_order_item_id')->constrained()->cascadeOnDelete();
            $table->decimal('accepted_quantity', 10, 2)->default(0);
            $table->decimal('rejected_quantity', 10, 2)->default(0);
            $table->decimal('returned_quantity', 10, 2)->default(0);
            $table->string('reason')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pod_items');
    }
};
