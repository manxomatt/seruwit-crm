<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('rentals', function (Blueprint $table): void {
            $table->foreignId('applied_period_tier_id')
                ->nullable()
                ->constrained('rental_rate_tiers')
                ->nullOnDelete();

            $table->foreignId('applied_loyalty_tier_id')
                ->nullable()
                ->constrained('rental_rate_tiers')
                ->nullOnDelete();

            $table->json('period_pricing_snapshot')->nullable();
            $table->decimal('tier_discount_amount', 14, 2)->default(0);
        });
    }

    public function down(): void
    {
        Schema::table('rentals', function (Blueprint $table): void {
            $table->dropConstrainedForeignId('applied_period_tier_id');
            $table->dropConstrainedForeignId('applied_loyalty_tier_id');
            $table->dropColumn(['period_pricing_snapshot', 'tier_discount_amount']);
        });
    }
};
