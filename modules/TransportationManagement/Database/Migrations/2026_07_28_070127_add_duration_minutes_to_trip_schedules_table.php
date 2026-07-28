<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('trip_schedules', function (Blueprint $table): void {
            $table->unsignedInteger('duration_minutes')->default(480)->after('time_of_day');
        });
    }

    public function down(): void
    {
        Schema::table('trip_schedules', function (Blueprint $table): void {
            $table->dropColumn('duration_minutes');
        });
    }
};
