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

        $exists = DB::table('settings')->where('key', 'rental.default_one_way_fee')->exists();

        if ($exists) {
            return;
        }

        DB::table('settings')->insert([
            'key' => 'rental.default_one_way_fee',
            'group' => 'rental',
            'value' => '150000',
            'type' => 'number',
            'label' => 'Default One-Way Fee (Rp)',
            'description' => 'Charged when pickup and return branches differ. Override per rental with one_way_fee_amount.',
            'is_public' => false,
            'sort_order' => 1,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function down(): void
    {
        if (! Schema::hasTable('settings')) {
            return;
        }

        DB::table('settings')->where('key', 'rental.default_one_way_fee')->delete();
    }
};
