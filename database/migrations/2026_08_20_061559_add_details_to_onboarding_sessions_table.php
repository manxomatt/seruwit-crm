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
            $table->string('phone', 50)->nullable()->after('company_name');
            $table->string('city', 100)->nullable()->after('phone');
            $table->string('fleet_size', 50)->nullable()->after('verticals');
            $table->string('rental_model', 50)->nullable()->after('fleet_size');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('onboarding_sessions', function (Blueprint $table) {
            $table->dropColumn(['phone', 'city', 'fleet_size', 'rental_model']);
        });
    }
};
