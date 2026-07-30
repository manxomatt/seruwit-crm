<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payment_gateway_configs', function (Blueprint $table) {
            $table->id();
            $table->string('provider', 40)->default('midtrans');
            $table->boolean('is_enabled')->default(false);
            $table->boolean('is_production')->default(false);
            $table->text('server_key')->nullable();
            $table->text('client_key')->nullable();
            $table->string('merchant_id')->nullable();
            $table->timestamps();
        });

        Schema::create('gateway_charges', function (Blueprint $table) {
            $table->id();
            $table->string('purpose', 40);
            $table->unsignedBigInteger('rental_id')->nullable()->index();
            $table->foreignId('invoice_id')->nullable()->constrained('invoices')->nullOnDelete();
            $table->foreignId('partner_id')->nullable()->constrained('partners')->nullOnDelete();
            $table->string('order_id', 64)->unique();
            $table->decimal('amount', 15, 2);
            $table->string('currency', 3)->default('IDR');
            $table->string('status', 30)->default('pending');
            $table->string('snap_token')->nullable();
            $table->string('redirect_url')->nullable();
            $table->string('payment_type')->nullable();
            $table->string('external_transaction_id')->nullable();
            $table->string('fraud_status')->nullable();
            $table->json('raw_request')->nullable();
            $table->json('raw_notification')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('paid_at')->nullable();
            $table->timestamps();

            $table->index(['purpose', 'status']);
            $table->index(['rental_id', 'purpose']);
            $table->index(['invoice_id', 'purpose']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('gateway_charges');
        Schema::dropIfExists('payment_gateway_configs');
    }
};
