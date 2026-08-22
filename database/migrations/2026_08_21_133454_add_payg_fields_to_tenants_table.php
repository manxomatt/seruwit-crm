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
        Schema::table('tenants', function (Blueprint $table) {
            $table->string('subscription_type', 20)
                ->nullable()
                ->after('status')
                ->comment('trial, payg, none');

            $table->integer('max_vehicles_allowed')
                ->nullable()
                ->after('subscription_type')
                ->comment('Dynamic limit berdasarkan subscription aktif');

            $table->foreignId('subscription_id')
                ->nullable()
                ->constrained('subscriptions')
                ->nullOnDelete()
                ->after('max_vehicles_allowed')
                ->comment('Denormalized FK ke subscription aktif');

            $table->index('subscription_type');
            $table->index('subscription_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            $table->dropIndex(['subscription_type']);

            // Dropping subscription_id also removes its foreign key and index
            // automatically in PostgreSQL, so doing so explicitly here would
            // double-drop and fail on migrate:rollback.
            $table->dropColumn([
                'subscription_type',
                'max_vehicles_allowed',
                'subscription_id',
            ]);
        });
    }
};
