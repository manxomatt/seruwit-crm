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
        Schema::create('order_charges', function (Blueprint $table) {
            $table->id();
            // Cascade is a pure safety net: Orders only deletes draft orders
            // and a charge is only created at confirm, so this should never
            // fire in practice.
            $table->foreignId('delivery_order_id')->unique()->constrained('delivery_orders')->cascadeOnDelete();
            // The charge amount is a snapshot; deleting a tariff must not
            // destroy priced work, it only loses provenance.
            $table->foreignId('tariff_id')->nullable()->constrained('tariffs')->nullOnDelete();
            $table->decimal('amount', 12, 2)->default(0);
            // Deleting a draft invoice automatically releases its charges for
            // re-invoicing.
            $table->foreignId('invoice_id')->nullable()->constrained('invoices')->nullOnDelete();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('order_charges');
    }
};
