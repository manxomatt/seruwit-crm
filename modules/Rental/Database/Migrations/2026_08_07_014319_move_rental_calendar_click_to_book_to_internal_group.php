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

        DB::table('settings')
            ->where('key', 'rental.calendar_click_to_book')
            ->update([
                'group' => 'rental_internal',
                'description' => 'Managed via Rental → Settings → General.',
                'updated_at' => now(),
            ]);
    }

    public function down(): void
    {
        if (! Schema::hasTable('settings')) {
            return;
        }

        DB::table('settings')
            ->where('key', 'rental.calendar_click_to_book')
            ->update([
                'group' => 'rental',
                'description' => 'When enabled, clicking a date (or free vehicle cell) on the rental calendar opens the reservation wizard.',
                'updated_at' => now(),
            ]);
    }
};
