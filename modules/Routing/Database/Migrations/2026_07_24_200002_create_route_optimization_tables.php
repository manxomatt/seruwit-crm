<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('route_plans', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->string('status')->default('draft');
            $table->string('objective')->default('fuel_cost');
            $table->date('planned_date');
            $table->string('depot_address')->nullable();
            $table->decimal('depot_lat', 10, 7);
            $table->decimal('depot_lng', 10, 7);
            $table->json('params')->nullable();
            $table->decimal('total_distance_km', 12, 2)->default(0);
            $table->decimal('total_cost', 15, 2)->default(0);
            $table->unsignedInteger('unassigned_count')->default(0);
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('optimized_at')->nullable();
            $table->timestamp('applied_at')->nullable();
            $table->timestamps();
        });

        Schema::create('route_plan_routes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('route_plan_id')->constrained('route_plans')->cascadeOnDelete();
            $table->unsignedSmallInteger('sequence');
            $table->foreignId('vehicle_id')->nullable()->constrained('vehicles')->nullOnDelete();
            $table->foreignId('driver_id')->nullable()->constrained('drivers')->nullOnDelete();
            $table->unsignedBigInteger('trip_id')->nullable()->index();
            $table->decimal('load_kg', 12, 2)->default(0);
            $table->decimal('estimated_distance_km', 12, 2)->default(0);
            $table->decimal('estimated_cost', 15, 2)->default(0);
            $table->timestamps();
        });

        Schema::create('route_plan_stops', function (Blueprint $table) {
            $table->id();
            $table->foreignId('route_plan_route_id')->constrained('route_plan_routes')->cascadeOnDelete();
            $table->unsignedBigInteger('delivery_order_id')->index();
            $table->unsignedSmallInteger('sequence');
            $table->string('address');
            $table->decimal('lat', 10, 7);
            $table->decimal('lng', 10, 7);
            $table->decimal('demand_kg', 12, 2)->default(0);
            $table->decimal('distance_from_previous_km', 12, 2)->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('route_plan_stops');
        Schema::dropIfExists('route_plan_routes');
        Schema::dropIfExists('route_plans');
    }
};
