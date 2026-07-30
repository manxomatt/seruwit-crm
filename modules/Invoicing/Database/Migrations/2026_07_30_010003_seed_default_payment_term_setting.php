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

        $exists = DB::table('settings')->where('key', 'invoicing.default_payment_term_days')->exists();

        if ($exists) {
            return;
        }

        DB::table('settings')->insert([
            'key' => 'invoicing.default_payment_term_days',
            'group' => 'invoicing',
            'value' => '0',
            'type' => 'number',
            'label' => 'Default Payment Term (Days)',
            'description' => 'Days until invoice due date. 0 = due on issue date (COD). Partner override wins when set.',
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

        DB::table('settings')->where('key', 'invoicing.default_payment_term_days')->delete();
    }
};
