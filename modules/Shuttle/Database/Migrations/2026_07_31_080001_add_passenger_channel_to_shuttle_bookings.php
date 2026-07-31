<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('shuttle_bookings')) {
            return;
        }

        Schema::table('shuttle_bookings', function (Blueprint $table): void {
            if (! Schema::hasColumn('shuttle_bookings', 'channel')) {
                $table->string('channel', 20)->default('ops')->after('partner_id');
            }
            if (! Schema::hasColumn('shuttle_bookings', 'booker_phone')) {
                $table->string('booker_phone', 32)->nullable()->after('channel');
            }
            if (! Schema::hasColumn('shuttle_bookings', 'booker_phone_verified_at')) {
                $table->timestamp('booker_phone_verified_at')->nullable()->after('booker_phone');
            }
            if (! Schema::hasColumn('shuttle_bookings', 'hold_expires_at')) {
                $table->timestamp('hold_expires_at')->nullable()->after('booker_phone_verified_at');
            }
            if (! Schema::hasColumn('shuttle_bookings', 'seats_held')) {
                $table->boolean('seats_held')->default(false)->after('hold_expires_at');
            }
            if (! Schema::hasColumn('shuttle_bookings', 'payment_status')) {
                $table->string('payment_status', 20)->default('unpaid')->after('seats_held');
            }
            if (! Schema::hasColumn('shuttle_bookings', 'public_token')) {
                $table->string('public_token', 40)->nullable()->unique()->after('payment_status');
            }
        });

        Schema::table('shuttle_bookings', function (Blueprint $table): void {
            $table->index(['departure_id', 'channel', 'status'], 'shuttle_bookings_departure_channel_status_index');
            $table->index('booker_phone');
            $table->index('hold_expires_at');
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('shuttle_bookings')) {
            return;
        }

        Schema::table('shuttle_bookings', function (Blueprint $table): void {
            $table->dropIndex('shuttle_bookings_departure_channel_status_index');
            $table->dropIndex(['booker_phone']);
            $table->dropIndex(['hold_expires_at']);
            $table->dropColumn([
                'channel',
                'booker_phone',
                'booker_phone_verified_at',
                'hold_expires_at',
                'seats_held',
                'payment_status',
                'public_token',
            ]);
        });
    }
};
