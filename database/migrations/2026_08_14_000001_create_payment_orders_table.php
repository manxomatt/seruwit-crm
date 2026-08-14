<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payment_orders', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('tenant_id');
            $table->foreignId('plan_id')->constrained()->cascadeOnDelete();
            $table->string('type', 20)->default('activate');
            $table->string('payment_method', 30)->default('manual_transfer');
            $table->string('status', 30)->default('pending');

            $table->decimal('amount', 14, 2);
            $table->unsignedSmallInteger('unique_code')->default(0);
            $table->decimal('total_amount', 14, 2);
            $table->string('currency', 3)->default('IDR');

            $table->string('bank_name', 100)->nullable();
            $table->string('bank_account_number', 50)->nullable();
            $table->string('bank_account_name', 100)->nullable();

            $table->string('transfer_proof_path')->nullable();
            $table->text('transfer_note')->nullable();

            $table->timestamp('confirmed_at')->nullable();
            $table->foreignId('confirmed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('subscription_id')->nullable()->constrained()->nullOnDelete();

            $table->timestamp('rejected_at')->nullable();
            $table->foreignId('rejected_by')->nullable()->constrained('users')->nullOnDelete();
            $table->text('rejection_reason')->nullable();

            $table->timestamp('expires_at');

            $table->json('gateway_data')->nullable();

            $table->timestamps();

            $table->foreign('tenant_id')->references('id')->on('tenants')->cascadeOnDelete();
            $table->index('tenant_id');
            $table->index('status');
            $table->index('expires_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payment_orders');
    }
};
