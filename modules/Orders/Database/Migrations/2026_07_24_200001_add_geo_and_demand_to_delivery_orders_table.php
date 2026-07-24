<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('delivery_orders', function (Blueprint $table) {
            $table->decimal('delivery_lat', 10, 7)->nullable()->after('delivery_address');
            $table->decimal('delivery_lng', 10, 7)->nullable()->after('delivery_lat');
            $table->decimal('demand_kg', 12, 2)->nullable()->after('delivery_lng');
        });
    }

    public function down(): void
    {
        Schema::table('delivery_orders', function (Blueprint $table) {
            $table->dropColumn(['delivery_lat', 'delivery_lng', 'demand_kg']);
        });
    }
};
