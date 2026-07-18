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
        Schema::table('trips', function (Blueprint $table) {
            // Nullable so existing trips are unaffected; StoreTripRequest
            // requires it going forward. No cascade — Customer must stay free
            // of any knowledge of Trip, so a customer still referenced by a
            // trip is protected at the database level instead.
            $table->foreignId('customer_id')->nullable()->after('trip_schedule_id')->constrained();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('trips', function (Blueprint $table) {
            $table->dropConstrainedForeignId('customer_id');
        });
    }
};
