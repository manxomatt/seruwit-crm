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
        Schema::table('payment_orders', function (Blueprint $table) {
            $table->foreignId('subscription_tier_id')
                ->nullable()
                ->constrained('subscription_tiers')
                ->nullOnDelete()
                ->after('plan_id')
                ->comment('Reference ke tier saat payment');

            $table->decimal('price_per_vehicle', 12, 2)
                ->nullable()
                ->after('subscribed_vehicles')
                ->comment('Snapshot harga per vehicle saat pembayaran');

            $table->decimal('total_vehicle_cost', 14, 2)
                ->nullable()
                ->after('price_per_vehicle')
                ->comment('subscribed_vehicles × price_per_vehicle');

            $table->integer('upgrade_from_vehicles')
                ->nullable()
                ->after('total_vehicle_cost')
                ->comment('Untuk tracking upgrade (dari berapa jadi berapa)');

            $table->decimal('prorated_amount', 14, 2)
                ->nullable()
                ->after('upgrade_from_vehicles')
                ->comment('Pro-rated calculation untuk mid-period upgrade');

            $table->index('subscription_tier_id');
            $table->index(['subscribed_vehicles', 'billing_interval']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('payment_orders', function (Blueprint $table) {
            $table->dropIndex(['subscribed_vehicles', 'billing_interval']);

            // Dropping subscription_tier_id also removes its foreign key and index
            // automatically in PostgreSQL, so doing so explicitly here would
            // double-drop and fail on migrate:rollback.
            $table->dropColumn([
                'subscription_tier_id',
                'price_per_vehicle',
                'total_vehicle_cost',
                'upgrade_from_vehicles',
                'prorated_amount',
            ]);
        });
    }
};
