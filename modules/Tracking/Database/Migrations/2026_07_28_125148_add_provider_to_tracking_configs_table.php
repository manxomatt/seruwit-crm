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
        Schema::table('tracking_configs', function (Blueprint $table) {
            // traccar = generic Traccar-compatible API; sky_track = custom X-Api-Key auth.
            $table->string('provider')->default('traccar')->after('id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tracking_configs', function (Blueprint $table) {
            $table->dropColumn('provider');
        });
    }
};
