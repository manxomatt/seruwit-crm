<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('vehicles', function (Blueprint $table) {
            $table->decimal('tank_capacity_liters', 8, 2)->nullable()->after('cost_per_km');
            $table->decimal('expected_km_per_liter', 8, 2)->nullable()->after('tank_capacity_liters');
        });

        Schema::table('fuel_logs', function (Blueprint $table) {
            $table->foreignId('driver_id')->nullable()->after('vehicle_id')->constrained('drivers')->nullOnDelete();
            $table->string('station_name')->nullable()->after('odometer_km');
            $table->string('receipt_number')->nullable()->after('station_name');
            $table->boolean('is_full_tank')->default(false)->after('receipt_number');
            $table->decimal('price_per_liter', 12, 2)->nullable()->after('is_full_tank');
            $table->string('odometer_source')->nullable()->after('price_per_liter');
            $table->unsignedInteger('distance_since_last_km')->nullable()->after('odometer_source');
            $table->decimal('km_per_liter', 8, 2)->nullable()->after('distance_since_last_km');
            $table->decimal('liters_per_100km', 8, 2)->nullable()->after('km_per_liter');
            $table->json('anomaly_flags')->nullable()->after('liters_per_100km');
            $table->text('notes')->nullable()->after('anomaly_flags');
        });
    }

    public function down(): void
    {
        Schema::table('fuel_logs', function (Blueprint $table) {
            $table->dropConstrainedForeignId('driver_id');
            $table->dropColumn([
                'station_name',
                'receipt_number',
                'is_full_tank',
                'price_per_liter',
                'odometer_source',
                'distance_since_last_km',
                'km_per_liter',
                'liters_per_100km',
                'anomaly_flags',
                'notes',
            ]);
        });

        Schema::table('vehicles', function (Blueprint $table) {
            $table->dropColumn(['tank_capacity_liters', 'expected_km_per_liter']);
        });
    }
};
