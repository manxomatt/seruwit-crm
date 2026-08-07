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

        if (DB::table('settings')->where('key', 'rental.calendar_click_to_book')->exists()) {
            return;
        }

        DB::table('settings')->insert([
            'key' => 'rental.calendar_click_to_book',
            'group' => 'rental',
            'value' => '1',
            'type' => 'boolean',
            'label' => 'Calendar click to book',
            'description' => 'When enabled, clicking a date (or free vehicle cell) on the rental calendar opens the reservation wizard.',
            'is_public' => false,
            'sort_order' => 20,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function down(): void
    {
        if (! Schema::hasTable('settings')) {
            return;
        }

        DB::table('settings')->where('key', 'rental.calendar_click_to_book')->delete();
    }
};
