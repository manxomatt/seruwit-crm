<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('shuttle_corridors') && ! Schema::hasColumn('shuttle_corridors', 'service_type')) {
            Schema::table('shuttle_corridors', function (Blueprint $table) {
                $table->string('service_type', 20)->default('pool')->after('destination_city');
                $table->index('service_type');
            });
        }

        if (Schema::hasTable('shuttle_departures') && ! Schema::hasColumn('shuttle_departures', 'service_type')) {
            Schema::table('shuttle_departures', function (Blueprint $table) {
                $table->string('service_type', 20)->default('pool')->after('corridor_id');
                $table->index('service_type');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('shuttle_departures') && Schema::hasColumn('shuttle_departures', 'service_type')) {
            Schema::table('shuttle_departures', function (Blueprint $table) {
                $table->dropIndex(['service_type']);
                $table->dropColumn('service_type');
            });
        }

        if (Schema::hasTable('shuttle_corridors') && Schema::hasColumn('shuttle_corridors', 'service_type')) {
            Schema::table('shuttle_corridors', function (Blueprint $table) {
                $table->dropIndex(['service_type']);
                $table->dropColumn('service_type');
            });
        }
    }
};
