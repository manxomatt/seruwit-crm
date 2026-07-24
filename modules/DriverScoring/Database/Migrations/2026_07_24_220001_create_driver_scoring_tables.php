<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('driver_scoring_settings', function (Blueprint $table) {
            $table->id();
            $table->decimal('harsh_brake_kph_per_s', 8, 2)->default(11);
            $table->decimal('harsh_accel_kph_per_s', 8, 2)->default(12);
            $table->decimal('speeding_limit_kph', 8, 2)->default(80);
            $table->decimal('idle_speed_kph', 8, 2)->default(3);
            $table->unsignedSmallInteger('idle_minutes')->default(10);
            $table->unsignedSmallInteger('min_sample_seconds')->default(3);
            $table->unsignedSmallInteger('max_sample_seconds')->default(60);
            $table->unsignedSmallInteger('event_dedupe_seconds')->default(30);
            $table->unsignedSmallInteger('daily_base_points')->default(100);
            $table->integer('points_harsh_brake')->default(-5);
            $table->integer('points_harsh_accel')->default(-3);
            $table->integer('points_speeding')->default(-4);
            $table->integer('points_idle')->default(-2);
            $table->timestamps();
        });

        Schema::create('driving_events', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('vehicle_id')->index();
            $table->unsignedBigInteger('driver_id')->nullable()->index();
            $table->unsignedBigInteger('gps_device_id')->nullable()->index();
            $table->unsignedBigInteger('trip_id')->nullable()->index();
            $table->string('type');
            $table->string('severity')->default('warning');
            $table->decimal('magnitude', 10, 2)->nullable();
            $table->decimal('speed_kph', 8, 2)->nullable();
            $table->decimal('latitude', 10, 7)->nullable();
            $table->decimal('longitude', 10, 7)->nullable();
            $table->integer('points_delta')->default(0);
            $table->timestamp('recorded_at')->index();
            $table->timestamp('ended_at')->nullable();
            $table->json('meta')->nullable();
            $table->timestamps();

            $table->index(['driver_id', 'recorded_at']);
            $table->index(['type', 'recorded_at']);
        });

        Schema::create('driver_daily_scores', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('driver_id')->index();
            $table->date('score_date');
            $table->unsignedSmallInteger('score')->default(100);
            $table->unsignedInteger('harsh_brake_count')->default(0);
            $table->unsignedInteger('harsh_accel_count')->default(0);
            $table->unsignedInteger('speeding_count')->default(0);
            $table->unsignedInteger('idle_count')->default(0);
            $table->integer('points_delta')->default(0);
            $table->unsignedInteger('event_count')->default(0);
            $table->timestamps();

            $table->unique(['driver_id', 'score_date']);
        });

        Schema::create('driver_incentive_rules', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('period')->default('weekly');
            $table->unsignedSmallInteger('min_score')->default(85);
            $table->unsignedInteger('min_days')->default(5);
            $table->decimal('reward_amount', 15, 2)->default(0);
            $table->string('reward_label')->nullable();
            $table->boolean('is_active')->default(true);
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('driver_incentive_awards', function (Blueprint $table) {
            $table->id();
            $table->foreignId('driver_incentive_rule_id')->constrained('driver_incentive_rules')->cascadeOnDelete();
            $table->unsignedBigInteger('driver_id')->index();
            $table->date('period_start');
            $table->date('period_end');
            $table->decimal('average_score', 5, 2);
            $table->unsignedInteger('scored_days');
            $table->decimal('reward_amount', 15, 2);
            $table->string('status')->default('pending');
            $table->timestamp('awarded_at')->nullable();
            $table->timestamps();

            $table->unique(['driver_incentive_rule_id', 'driver_id', 'period_start', 'period_end'], 'incentive_awards_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('driver_incentive_awards');
        Schema::dropIfExists('driver_incentive_rules');
        Schema::dropIfExists('driver_daily_scores');
        Schema::dropIfExists('driving_events');
        Schema::dropIfExists('driver_scoring_settings');
    }
};
