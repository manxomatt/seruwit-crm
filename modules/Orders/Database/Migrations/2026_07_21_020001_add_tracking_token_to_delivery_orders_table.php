<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('delivery_orders', function (Blueprint $table) {
            // The public tracking link keys on this. The DO code is sequential
            // and guessable, so a random token is what keeps a customer's link
            // from being enumerable.
            $table->string('tracking_token', 40)->nullable()->unique()->after('code');
        });

        // Backfill existing orders so their tracking links work immediately.
        DB::table('delivery_orders')->whereNull('tracking_token')->orderBy('id')
            ->each(fn ($order) => DB::table('delivery_orders')
                ->where('id', $order->id)
                ->update(['tracking_token' => Str::random(40)]));
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('delivery_orders', function (Blueprint $table) {
            $table->dropColumn('tracking_token');
        });
    }
};
