<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('delivery_orders', function (Blueprint $table) {
            $table->foreignId('pickup_location_id')
                ->nullable()
                ->after('pickup_address')
                ->constrained('locations')
                ->nullOnDelete();
            $table->foreignId('delivery_location_id')
                ->nullable()
                ->after('delivery_address')
                ->constrained('locations')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('delivery_orders', function (Blueprint $table) {
            $table->dropConstrainedForeignId('pickup_location_id');
            $table->dropConstrainedForeignId('delivery_location_id');
        });
    }
};
