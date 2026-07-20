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
        Schema::table('trip_checkpoints', function (Blueprint $table) {
            // Every checkpoint that exists today was typed in by an operator,
            // so the default backfills them correctly.
            $table->string('source')->default('manual')->after('trip_id');
            // Missing until now, and about to matter: with GPS feeding the
            // trail, a long trip carries thousands of checkpoints that the trip
            // page reads in recorded_at order.
            $table->index(['trip_id', 'recorded_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('trip_checkpoints', function (Blueprint $table) {
            $table->dropIndex(['trip_id', 'recorded_at']);
            $table->dropColumn('source');
        });
    }
};
