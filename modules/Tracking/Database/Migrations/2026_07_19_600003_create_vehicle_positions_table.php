<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * The largest table in the system by two orders of magnitude: one row per
     * vehicle per minute is 1,440 a day, so a fifty-vehicle tenant writes about
     * 26 million rows a year. It is a rolling operational buffer, trimmed by
     * tracking:prune to the tenant's retention window — the durable trip record
     * is the throttled trail written into trip_checkpoints, which is roughly a
     * row per 200 metres and kept forever.
     */
    public function up(): void
    {
        Schema::create('vehicle_positions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('gps_device_id')->constrained()->cascadeOnDelete();
            // Deliberately no foreign key, same departure as
            // trip_stops.delivery_order_id. This is a point-in-time snapshot of
            // which vehicle carried the device, which is precisely what keeps
            // history correct after a tracker is moved to another vehicle; a
            // nullOnDelete FK would rewrite millions of historical rows and
            // destroy that attribution. Telemetry exhaust must also never block
            // deleting a vehicle the way an operational reference legitimately
            // should.
            $table->unsignedBigInteger('vehicle_id')->nullable();

            $table->decimal('latitude', 10, 7);
            $table->decimal('longitude', 10, 7);
            $table->decimal('speed_kph', 6, 2)->default(0);
            $table->decimal('course', 5, 2)->nullable();
            $table->decimal('altitude', 8, 2)->nullable();
            $table->boolean('ignition')->nullable();
            $table->boolean('motion')->nullable();
            $table->unsignedBigInteger('total_distance_m')->nullable();

            // Device clock (Traccar fixTime) — half of the dedupe key below.
            $table->dateTime('recorded_at');
            $table->dateTime('server_time')->nullable();
            $table->json('attributes')->nullable();

            // Positions are append-only, so updated_at would never be read.
            $table->timestamp('created_at')->useCurrent();

            // Idempotency lives in the database, not the application: a
            // re-run poll or a retried HTTP call inserts nothing.
            $table->unique(['gps_device_id', 'recorded_at']);
            $table->index(['vehicle_id', 'recorded_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('vehicle_positions');
    }
};
