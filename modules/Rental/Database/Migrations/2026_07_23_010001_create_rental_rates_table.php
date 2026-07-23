<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('rental_rates', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('vehicle_id')->nullable()->constrained('vehicles')->nullOnDelete();
            $table->string('vehicle_type')->nullable();
            $table->string('name');
            $table->enum('period_type', ['daily', 'weekly', 'monthly']);
            $table->decimal('rate_per_period', 14, 2);
            $table->integer('km_limit_per_period')->nullable();
            $table->decimal('excess_km_rate', 10, 2)->nullable();
            $table->decimal('deposit_amount', 14, 2)->default(0);
            $table->boolean('is_active')->default(true);
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('rental_rates');
    }
};
