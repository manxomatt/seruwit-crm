<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('subscription_billing_reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('subscription_id')->constrained()->onDelete('cascade');
            $table->foreignId('payment_order_id')->nullable()->constrained()->onDelete('set null');
            $table->year('year');
            $table->unsignedTinyInteger('month');
            $table->decimal('total_amount', 15, 0);
            $table->decimal('vehicle_cost', 15, 0);
            $table->integer('vehicle_count');
            $table->string('billing_interval');
            $table->string('status')->default('pending');
            $table->timestamp('billed_at')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->timestamps();
            $table->unique(['subscription_id', 'year', 'month']);
            $table->index('subscription_id');
            $table->index('status');
            $table->index(['year', 'month']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('subscription_billing_reports');
    }
};
