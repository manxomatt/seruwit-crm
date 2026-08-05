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

        $now = now();

        $rows = [
            [
                'key' => 'rental.pending_reserved_ttl_minutes',
                'group' => 'rental',
                'value' => '120',
                'type' => 'number',
                'label' => 'Pending Reserved TTL (minutes)',
                'description' => 'Online unpaid bookings stay reserved this long, then move to Pending (vehicle no longer held). Default 120 (HQ Rentals style).',
                'is_public' => false,
                'sort_order' => 10,
            ],
            [
                'key' => 'rental.cancellation_fee_type',
                'group' => 'rental',
                'value' => 'fixed',
                'type' => 'string',
                'label' => 'Cancellation fee type',
                'description' => 'fixed = Rp amount; percent = % of rental base_amount.',
                'is_public' => false,
                'sort_order' => 11,
            ],
            [
                'key' => 'rental.cancellation_fee_amount',
                'group' => 'rental',
                'value' => '0',
                'type' => 'number',
                'label' => 'Cancellation fee amount',
                'description' => 'Fee charged when marking Cancelled Paid. 0 disables the fee.',
                'is_public' => false,
                'sort_order' => 12,
            ],
            [
                'key' => 'rental.no_show_fee_type',
                'group' => 'rental',
                'value' => 'fixed',
                'type' => 'string',
                'label' => 'No-show fee type',
                'description' => 'fixed = Rp amount; percent = % of rental base_amount.',
                'is_public' => false,
                'sort_order' => 13,
            ],
            [
                'key' => 'rental.no_show_fee_amount',
                'group' => 'rental',
                'value' => '0',
                'type' => 'number',
                'label' => 'No-show fee amount',
                'description' => 'Fee charged when marking No Show Paid. 0 disables the fee.',
                'is_public' => false,
                'sort_order' => 14,
            ],
        ];

        foreach ($rows as $row) {
            if (DB::table('settings')->where('key', $row['key'])->exists()) {
                continue;
            }

            DB::table('settings')->insert([
                ...$row,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }
    }

    public function down(): void
    {
        if (! Schema::hasTable('settings')) {
            return;
        }

        DB::table('settings')->whereIn('key', [
            'rental.pending_reserved_ttl_minutes',
            'rental.cancellation_fee_type',
            'rental.cancellation_fee_amount',
            'rental.no_show_fee_type',
            'rental.no_show_fee_amount',
        ])->delete();
    }
};
