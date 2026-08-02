<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('settings')) {
            return;
        }

        if (DB::table('settings')->where('key', 'rental.passenger_booking_enabled')->exists()) {
            return;
        }

        DB::table('settings')->insert([
            'key' => 'rental.passenger_booking_enabled',
            'group' => 'rental',
            'value' => '0',
            'type' => 'boolean',
            'label' => 'Mobile / passenger rental booking',
            'description' => 'Enable JSON mobile API surfaces under /api/mobile/v1/rental/*',
            'is_public' => false,
            'sort_order' => 2,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function down(): void
    {
        if (! Schema::hasTable('settings')) {
            return;
        }

        DB::table('settings')->where('key', 'rental.passenger_booking_enabled')->delete();
    }
};
