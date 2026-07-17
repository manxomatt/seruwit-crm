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
        Schema::create('vehicles', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('plate_number')->unique();
            $table->string('type');
            $table->string('brand')->nullable();
            $table->unsignedSmallInteger('model_year')->nullable();
            $table->string('capacity')->nullable();
            $table->string('fuel_type');
            $table->string('status')->default('active');
            $table->unsignedInteger('odometer_km')->default(0);
            $table->date('stnk_expires_at')->nullable();
            $table->date('kir_expires_at')->nullable();
            $table->string('photo_url')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('vehicles');
    }
};
