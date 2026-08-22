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
        Schema::create('subscription_renewals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('subscription_id')->constrained()->onDelete('cascade');
            $table->foreignId('payment_order_id')->nullable()->constrained()->onDelete('set null');
            $table->enum('status', ['pending', 'processing', 'completed', 'failed', 'cancelled'])->default('pending');
            $table->timestamp('renewal_date');
            $table->timestamp('processed_at')->nullable();
            $table->string('failure_reason')->nullable();
            $table->integer('attempt_count')->default(0);
            $table->timestamp('last_attempt_at')->nullable();
            $table->timestamps();
            $table->index('subscription_id');
            $table->index('status');
            $table->index('renewal_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('subscription_renewals');
    }
};
