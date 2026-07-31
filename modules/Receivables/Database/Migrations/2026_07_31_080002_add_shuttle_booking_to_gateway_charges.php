<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('gateway_charges')) {
            return;
        }

        Schema::table('gateway_charges', function (Blueprint $table): void {
            if (! Schema::hasColumn('gateway_charges', 'shuttle_booking_id')) {
                $table->unsignedBigInteger('shuttle_booking_id')->nullable()->after('invoice_id');
                $table->index(['shuttle_booking_id', 'purpose']);
            }
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('gateway_charges') || ! Schema::hasColumn('gateway_charges', 'shuttle_booking_id')) {
            return;
        }

        Schema::table('gateway_charges', function (Blueprint $table): void {
            $table->dropIndex(['shuttle_booking_id', 'purpose']);
            $table->dropColumn('shuttle_booking_id');
        });
    }
};
