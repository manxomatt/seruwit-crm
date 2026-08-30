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
        Schema::create('tenant_capacity_transactions', function (Blueprint $table): void {
            $table->id();
            $table->string('tenant_id');
            $table->foreign('tenant_id')->references('id')->on('tenants')->cascadeOnDelete();
            $table->integer('amount')->comment('Penambahan atau pengurangan saldo kredit');
            $table->unsignedInteger('balance_after')->comment('Saldo kredit akhir setelah transaksi');
            $table->string('type', 50)->comment('purchase, activation, renewal, admin_adjustment, bonus, correction, refund');
            $table->string('description', 255);
            $table->string('reference_id', 100)->nullable()->comment('ID referensi seperti vehicle_id atau payment_order_id');
            $table->uuid('created_by_id')->nullable()->comment('Global user ID pembuat transaksi');
            $table->foreign('created_by_id')->references('global_id')->on('users')->nullOnDelete();
            $table->timestamps();

            $table->index('tenant_id');
            $table->index('type');
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tenant_capacity_transactions');
    }
};
