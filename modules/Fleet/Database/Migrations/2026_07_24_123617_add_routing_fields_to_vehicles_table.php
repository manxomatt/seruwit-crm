<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('vehicles', function (Blueprint $table) {
            $table->decimal('capacity_kg', 12, 2)->nullable()->after('capacity');
            $table->decimal('cost_per_km', 12, 2)->nullable()->after('capacity_kg');
        });
    }

    public function down(): void
    {
        Schema::table('vehicles', function (Blueprint $table) {
            $table->dropColumn(['capacity_kg', 'cost_per_km']);
        });
    }
};
