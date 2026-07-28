<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tracking_configs', function (Blueprint $table): void {
            $table->boolean('alerts_enabled')->default(true)->after('poll_enabled');
            $table->unsignedSmallInteger('alert_speed_kph')->default(80)->after('alerts_enabled');
            $table->unsignedSmallInteger('alert_stale_minutes')->default(15)->after('alert_speed_kph');
            $table->unsignedSmallInteger('alert_idle_minutes')->default(30)->after('alert_stale_minutes');
            $table->unsignedSmallInteger('alert_cooldown_minutes')->default(30)->after('alert_idle_minutes');
        });

        Schema::create('tracking_geofences', function (Blueprint $table): void {
            $table->id();
            $table->string('name');
            $table->decimal('latitude', 10, 7);
            $table->decimal('longitude', 10, 7);
            $table->unsignedInteger('radius_m')->default(500);
            // exit | enter | both
            $table->string('alert_on', 16)->default('exit');
            $table->boolean('active_rentals_only')->default(true);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('tracking_alert_states', function (Blueprint $table): void {
            $table->id();
            $table->string('alert_key')->unique();
            $table->string('kind', 32);
            $table->foreignId('vehicle_id')->nullable()->constrained('vehicles')->nullOnDelete();
            $table->foreignId('gps_device_id')->nullable()->constrained('gps_devices')->nullOnDelete();
            $table->timestamp('idle_since')->nullable();
            $table->boolean('inside_geofence')->nullable();
            $table->timestamp('last_alerted_at')->nullable();
            $table->json('meta')->nullable();
            $table->timestamps();

            $table->index(['kind', 'vehicle_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tracking_alert_states');
        Schema::dropIfExists('tracking_geofences');

        Schema::table('tracking_configs', function (Blueprint $table): void {
            $table->dropColumn([
                'alerts_enabled',
                'alert_speed_kph',
                'alert_stale_minutes',
                'alert_idle_minutes',
                'alert_cooldown_minutes',
            ]);
        });
    }
};
