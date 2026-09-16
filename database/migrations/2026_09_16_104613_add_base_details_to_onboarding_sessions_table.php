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
        Schema::table('onboarding_sessions', function (Blueprint $table) {
            $table->string('base_name', 120)->nullable()->after('rental_model');
            $table->string('base_code', 32)->nullable()->after('base_name');
            $table->string('base_address', 255)->nullable()->after('base_code');
            $table->string('base_city', 100)->nullable()->after('base_address');
            $table->string('base_province', 100)->nullable()->after('base_city');
            $table->string('base_phone', 50)->nullable()->after('base_province');
            $table->string('base_email', 120)->nullable()->after('base_phone');
            $table->string('base_opens_at', 10)->nullable()->after('base_email');
            $table->string('base_closes_at', 10)->nullable()->after('base_opens_at');
            $table->unsignedSmallInteger('base_vehicle_capacity')->nullable()->after('base_closes_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('onboarding_sessions', function (Blueprint $table) {
            $table->dropColumn([
                'base_name',
                'base_code',
                'base_address',
                'base_city',
                'base_province',
                'base_phone',
                'base_email',
                'base_opens_at',
                'base_closes_at',
                'base_vehicle_capacity',
            ]);
        });
    }
};
