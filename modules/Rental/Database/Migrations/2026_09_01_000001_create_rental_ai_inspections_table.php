<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('rental_ai_inspections', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('rental_id')->constrained('rentals')->cascadeOnDelete();
            $table->string('inspection_type', 32)->default('handover_return');
            $table->string('model_used', 64);
            $table->unsignedInteger('extracted_odometer')->nullable();
            $table->string('extracted_fuel_level', 16)->nullable();
            $table->text('condition_summary')->nullable();
            $table->string('overall_status', 32)->default('clean');
            $table->json('detected_damages');
            $table->json('raw_response')->nullable();
            $table->foreignId('created_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['rental_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('rental_ai_inspections');
    }
};
