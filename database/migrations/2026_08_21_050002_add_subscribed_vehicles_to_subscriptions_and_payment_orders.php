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
        Schema::table('subscriptions', function (Blueprint $table) {
            $table->integer('subscribed_vehicles')->default(0)->after('plan_id');
        });

        Schema::table('payment_orders', function (Blueprint $table) {
            $table->integer('subscribed_vehicles')->default(0)->after('plan_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('subscriptions', function (Blueprint $table) {
            $table->dropColumn('subscribed_vehicles');
        });

        Schema::table('payment_orders', function (Blueprint $table) {
            $table->dropColumn('subscribed_vehicles');
        });
    }
};
