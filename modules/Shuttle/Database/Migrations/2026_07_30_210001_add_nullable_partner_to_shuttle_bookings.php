<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('shuttle_bookings') || ! Schema::hasColumn('shuttle_bookings', 'partner_id')) {
            return;
        }

        Schema::table('shuttle_bookings', function (Blueprint $table) {
            $table->dropForeign(['partner_id']);
        });

        Schema::table('shuttle_bookings', function (Blueprint $table) {
            $table->unsignedBigInteger('partner_id')->nullable()->change();
            $table->foreign('partner_id')->references('id')->on('partners')->nullOnDelete();
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('shuttle_bookings') || ! Schema::hasColumn('shuttle_bookings', 'partner_id')) {
            return;
        }

        Schema::table('shuttle_bookings', function (Blueprint $table) {
            $table->dropForeign(['partner_id']);
        });

        Schema::table('shuttle_bookings', function (Blueprint $table) {
            $table->unsignedBigInteger('partner_id')->nullable(false)->change();
            $table->foreign('partner_id')->references('id')->on('partners')->restrictOnDelete();
        });
    }
};
