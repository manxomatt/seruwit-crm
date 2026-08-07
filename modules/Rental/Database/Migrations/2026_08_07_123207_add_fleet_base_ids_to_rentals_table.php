<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('rentals', function (Blueprint $table): void {
            $table->foreignId('pickup_fleet_base_id')
                ->nullable()
                ->after('return_location_id')
                ->constrained('fleet_bases')
                ->nullOnDelete();
            $table->foreignId('return_fleet_base_id')
                ->nullable()
                ->after('pickup_fleet_base_id')
                ->constrained('fleet_bases')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('rentals', function (Blueprint $table): void {
            $table->dropConstrainedForeignId('pickup_fleet_base_id');
            $table->dropConstrainedForeignId('return_fleet_base_id');
        });
    }
};
