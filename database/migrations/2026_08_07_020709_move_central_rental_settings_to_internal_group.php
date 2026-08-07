<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /** @var list<string> */
    private array $keys = [
        'rental.default_one_way_fee',
        'rental.passenger_booking_enabled',
        'rental.pending_reserved_ttl_minutes',
        'rental.cancellation_fee_type',
        'rental.cancellation_fee_amount',
        'rental.no_show_fee_type',
        'rental.no_show_fee_amount',
        'rental.calendar_click_to_book',
    ];

    public function up(): void
    {
        if (! Schema::hasTable('settings')) {
            return;
        }

        DB::table('settings')
            ->whereIn('key', $this->keys)
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
            ->whereIn('key', $this->keys)
            ->update([
                'group' => 'rental',
                'updated_at' => now(),
            ]);
    }
};
