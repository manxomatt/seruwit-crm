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
        Schema::create('tracking_configs', function (Blueprint $table) {
            $table->id();
            // Nullable so the row can exist before it is configured; falls back
            // to services.traccar.base_url, which is the company's own server.
            $table->string('base_url')->nullable();
            $table->string('auth_type')->default('basic');
            $table->string('email')->nullable();
            // Encrypted casts on the model. Credentials live here rather than
            // in the settings table because that one stores plaintext and ships
            // its values to the front end as a shared Inertia prop.
            $table->text('password')->nullable();
            $table->text('token')->nullable();
            $table->boolean('poll_enabled')->default(false);
            $table->unsignedInteger('geofence_radius_m')->default(200);
            $table->unsignedInteger('checkpoint_min_distance_m')->default(200);
            $table->unsignedSmallInteger('checkpoint_min_interval_minutes')->default(5);
            $table->unsignedSmallInteger('retention_days')->default(90);
            $table->dateTime('last_polled_at')->nullable();
            // Surfaced on the settings page: without it an expired token looks
            // exactly like "the map just stopped working".
            $table->string('last_poll_error')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tracking_configs');
    }
};
