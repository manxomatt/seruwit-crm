<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('rental_vehicle_swaps', function (Blueprint $table) {
            $table->id();
            $table->foreignId('rental_id')->constrained('rentals')->cascadeOnDelete();
            $table->foreignId('from_vehicle_id')->constrained('vehicles')->restrictOnDelete();
            $table->foreignId('to_vehicle_id')->constrained('vehicles')->restrictOnDelete();
            $table->unsignedInteger('odometer_km')->nullable();
            $table->string('notes')->nullable();
            $table->foreignId('swapped_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('swapped_at');
            $table->timestamps();

            $table->index(['rental_id', 'swapped_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('rental_vehicle_swaps');
    }
};
