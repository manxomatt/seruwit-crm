<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('price_histories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('subscription_tier_id')->nullable()->constrained()->onDelete('set null');
            $table->decimal('old_price_per_vehicle', 15, 0)->nullable();
            $table->decimal('new_price_per_vehicle', 15, 0);
            $table->string('change_reason')->nullable();
            $table->timestamp('effective_date');
            $table->timestamps();
            $table->index('subscription_tier_id');
            $table->index('effective_date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('price_histories');
    }
};
