<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('maintenance_schedules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('vehicle_id')->constrained()->cascadeOnDelete();
            $table->foreignId('category_id')->constrained('maintenance_categories')->restrictOnDelete();

            $table->string('name');
            // 'mileage' | 'calendar'
            $table->string('interval_type', 20)->default('mileage');
            // km for mileage, days for calendar
            $table->unsignedInteger('interval_value');

            $table->unsignedInteger('last_service_odometer')->nullable();
            $table->date('last_service_date')->nullable();

            // Computed: last_service_odometer + interval_value
            $table->unsignedInteger('next_service_odometer')->nullable();
            // Computed: last_service_date + interval_value days
            $table->date('next_service_date')->nullable();

            $table->boolean('is_active')->default(true);
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['vehicle_id', 'is_active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('maintenance_schedules');
    }
};
