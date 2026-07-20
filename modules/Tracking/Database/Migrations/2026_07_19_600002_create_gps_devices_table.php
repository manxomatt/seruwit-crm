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
        Schema::create('gps_devices', function (Blueprint $table) {
            $table->id();
            // Unique but nullable: Postgres allows many NULLs in a unique
            // index, which gives exactly "at most one device per vehicle,
            // unlimited unpaired devices". Swapping a tracker is unpair then
            // pair, and the device row survives.
            //
            // No cascade — Fleet must stay free of any knowledge of Tracking,
            // so a vehicle with a device still paired is protected at the
            // database level instead. Same pattern as trips.vehicle_id.
            $table->foreignId('vehicle_id')->nullable()->unique()->constrained();
            $table->unsignedBigInteger('traccar_device_id')->unique();
            $table->string('unique_id')->unique();
            $table->string('name');
            $table->string('status')->nullable();
            $table->dateTime('last_seen_at')->nullable();

            // Denormalized last fix, so the live fleet map is one cheap query
            // instead of a latest-row-per-device lookup over a table that grows
            // by a row per vehicle per minute.
            $table->decimal('last_latitude', 10, 7)->nullable();
            $table->decimal('last_longitude', 10, 7)->nullable();
            $table->decimal('last_speed_kph', 6, 2)->nullable();
            $table->decimal('last_course', 5, 2)->nullable();
            $table->dateTime('last_recorded_at')->nullable();

            // The odometer trio. vehicles.odometer_km counts whole kilometres,
            // so incrementing it by each poll's sub-kilometre delta would floor
            // to zero forever. Instead metres accumulate here and the vehicle's
            // odometer is recomputed as base + accumulated/1000, which is
            // idempotent and cannot drift.
            $table->unsignedBigInteger('traccar_total_distance_m')->nullable();
            $table->unsignedBigInteger('accumulated_distance_m')->default(0);
            $table->unsignedInteger('odometer_base_km')->default(0);

            $table->dateTime('last_polled_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('gps_devices');
    }
};
