<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('rental_rate_tiers', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('rental_rate_id')->constrained()->cascadeOnDelete();

            $table->enum('tier_type', ['period_volume', 'loyalty_count']);
            $table->unsignedInteger('min_threshold');
            $table->unsignedInteger('max_threshold')->nullable();

            $table->decimal('rate_per_period', 14, 2)->nullable();
            $table->decimal('discount_percent', 5, 2)->nullable();
            $table->decimal('discount_flat', 14, 2)->nullable();

            $table->unsignedInteger('priority')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['rental_rate_id', 'tier_type', 'is_active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('rental_rate_tiers');
    }
};
