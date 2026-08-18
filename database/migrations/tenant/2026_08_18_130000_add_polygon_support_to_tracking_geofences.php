<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('tracking_geofences')) {
            Schema::table('tracking_geofences', function (Blueprint $table): void {
                if (! Schema::hasColumn('tracking_geofences', 'type')) {
                    $table->string('type', 16)->default('circle')->after('name');
                }
                if (! Schema::hasColumn('tracking_geofences', 'coordinates')) {
                    $table->json('coordinates')->nullable()->after('type');
                }
                $table->decimal('latitude', 10, 7)->nullable()->change();
                $table->decimal('longitude', 10, 7)->nullable()->change();
                $table->unsignedInteger('radius_m')->nullable()->change();
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('tracking_geofences')) {
            Schema::table('tracking_geofences', function (Blueprint $table): void {
                $table->dropColumn(array_filter([
                    Schema::hasColumn('tracking_geofences', 'type') ? 'type' : null,
                    Schema::hasColumn('tracking_geofences', 'coordinates') ? 'coordinates' : null,
                ]));
                $table->decimal('latitude', 10, 7)->nullable(false)->change();
                $table->decimal('longitude', 10, 7)->nullable(false)->change();
                $table->unsignedInteger('radius_m')->default(500)->nullable(false)->change();
            });
        }
    }
};
