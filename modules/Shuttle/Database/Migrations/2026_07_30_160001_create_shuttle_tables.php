<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('shuttle_corridors', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->string('name');
            $table->string('origin_city');
            $table->string('destination_city');
            $table->foreignId('origin_location_id')->nullable()->constrained('locations')->nullOnDelete();
            $table->foreignId('destination_location_id')->nullable()->constrained('locations')->nullOnDelete();
            $table->decimal('base_fare', 15, 2);
            $table->unsignedInteger('estimated_duration_minutes')->nullable();
            $table->decimal('distance_km', 10, 2)->nullable();
            $table->boolean('is_active')->default(true);
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('shuttle_pools', function (Blueprint $table) {
            $table->id();
            $table->foreignId('location_id')->unique()->constrained('locations')->cascadeOnDelete();
            $table->foreignId('corridor_id')->nullable()->constrained('shuttle_corridors')->nullOnDelete();
            $table->boolean('is_origin')->default(true);
            $table->boolean('is_destination')->default(true);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('shuttle_schedules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('corridor_id')->constrained('shuttle_corridors')->cascadeOnDelete();
            $table->string('code')->unique();
            $table->json('days_of_week');
            $table->time('departure_time');
            $table->foreignId('vehicle_id')->nullable()->constrained('vehicles')->nullOnDelete();
            $table->foreignId('driver_id')->nullable()->constrained('drivers')->nullOnDelete();
            $table->unsignedSmallInteger('seat_capacity')->default(7);
            $table->unsignedInteger('pickup_cutoff_minutes')->default(90);
            $table->date('starts_on')->nullable();
            $table->date('ends_on')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('shuttle_departures', function (Blueprint $table) {
            $table->id();
            $table->foreignId('schedule_id')->nullable()->constrained('shuttle_schedules')->nullOnDelete();
            $table->foreignId('corridor_id')->constrained('shuttle_corridors')->restrictOnDelete();
            $table->string('departure_number')->unique();
            $table->date('depart_date');
            $table->time('depart_time');
            $table->foreignId('vehicle_id')->nullable()->constrained('vehicles')->nullOnDelete();
            $table->foreignId('driver_id')->nullable()->constrained('drivers')->nullOnDelete();
            $table->unsignedSmallInteger('seat_capacity')->default(7);
            $table->unsignedSmallInteger('seats_booked')->default(0);
            $table->string('status')->default('open')->index();
            $table->foreignId('origin_pool_id')->nullable()->constrained('locations')->nullOnDelete();
            $table->foreignId('destination_pool_id')->nullable()->constrained('locations')->nullOnDelete();
            $table->timestamp('optimized_at')->nullable();
            $table->timestamp('dispatched_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->unique(['corridor_id', 'depart_date', 'depart_time', 'schedule_id'], 'shuttle_departures_unique_slot');
        });

        Schema::create('shuttle_bookings', function (Blueprint $table) {
            $table->id();
            $table->string('booking_number')->unique();
            $table->foreignId('departure_id')->constrained('shuttle_departures')->cascadeOnDelete();
            $table->foreignId('partner_id')->constrained('partners')->restrictOnDelete();
            $table->foreignId('booked_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('status')->default('draft')->index();
            $table->unsignedTinyInteger('passenger_count')->default(1);
            $table->decimal('unit_fare', 15, 2);
            $table->decimal('total_fare', 15, 2);
            $table->string('pickup_mode')->default('pool');
            $table->string('dropoff_mode')->default('pool');
            $table->string('pickup_address')->nullable();
            $table->decimal('pickup_lat', 10, 7)->nullable();
            $table->decimal('pickup_lng', 10, 7)->nullable();
            $table->time('pickup_window_start')->nullable();
            $table->time('pickup_window_end')->nullable();
            $table->string('dropoff_address')->nullable();
            $table->decimal('dropoff_lat', 10, 7)->nullable();
            $table->decimal('dropoff_lng', 10, 7)->nullable();
            $table->foreignId('invoice_id')->nullable()->constrained('invoices')->nullOnDelete();
            $table->text('notes')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->timestamps();
        });

        Schema::create('shuttle_passengers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('booking_id')->constrained('shuttle_bookings')->cascadeOnDelete();
            $table->string('name');
            $table->string('phone')->nullable();
            $table->string('id_number')->nullable();
            $table->string('seat_label')->nullable();
            $table->timestamps();
        });

        Schema::create('shuttle_route_stops', function (Blueprint $table) {
            $table->id();
            $table->foreignId('departure_id')->constrained('shuttle_departures')->cascadeOnDelete();
            $table->foreignId('booking_id')->nullable()->constrained('shuttle_bookings')->nullOnDelete();
            $table->string('stop_type');
            $table->unsignedSmallInteger('sequence');
            $table->string('address');
            $table->decimal('lat', 10, 7);
            $table->decimal('lng', 10, 7);
            $table->timestamp('eta_at')->nullable();
            $table->decimal('distance_from_previous_km', 10, 2)->default(0);
            $table->string('status')->default('pending');
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            $table->index(['departure_id', 'sequence']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('shuttle_route_stops');
        Schema::dropIfExists('shuttle_passengers');
        Schema::dropIfExists('shuttle_bookings');
        Schema::dropIfExists('shuttle_departures');
        Schema::dropIfExists('shuttle_schedules');
        Schema::dropIfExists('shuttle_pools');
        Schema::dropIfExists('shuttle_corridors');
    }
};
