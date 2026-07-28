<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tariffs', function (Blueprint $table) {
            $table->foreignId('origin_location_id')
                ->nullable()
                ->after('partner_id')
                ->constrained('locations')
                ->nullOnDelete();
            $table->foreignId('destination_location_id')
                ->nullable()
                ->after('origin_location_id')
                ->constrained('locations')
                ->nullOnDelete();

            $table->index(['origin_location_id', 'destination_location_id']);
        });
    }

    public function down(): void
    {
        Schema::table('tariffs', function (Blueprint $table) {
            $table->dropConstrainedForeignId('origin_location_id');
            $table->dropConstrainedForeignId('destination_location_id');
        });
    }
};
