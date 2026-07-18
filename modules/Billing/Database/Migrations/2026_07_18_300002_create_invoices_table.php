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
        Schema::create('invoices', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            // No cascade — Customer must stay free of any knowledge of
            // Billing, so a customer still referenced by an invoice is
            // protected at the database level instead. Same pattern as
            // delivery_orders.customer_id.
            $table->foreignId('customer_id')->constrained();
            $table->string('status')->default('draft')->index();
            $table->date('issue_date');
            $table->date('due_date')->nullable();
            $table->boolean('tax_enabled');
            $table->decimal('tax_rate', 5, 2);
            $table->decimal('subtotal', 12, 2)->default(0);
            $table->decimal('tax_amount', 12, 2)->default(0);
            $table->decimal('total', 12, 2)->default(0);
            $table->dateTime('paid_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('invoices');
    }
};
