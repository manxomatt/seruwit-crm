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

        DB::table('settings')->updateOrInsert(
            ['key' => 'rental.addons_enabled'],
            [
                'group' => 'rental_internal',
                'value' => '1',
                'type' => 'boolean',
                'label' => 'Self-service Add-ons & Extra Accessories Hub',
                'description' => 'Managed via Rental → Settings → General.',
                'is_public' => false,
                'sort_order' => 26,
                'created_at' => now(),
                'updated_at' => now(),
            ]
        );
    }

    public function down(): void
    {
        if (! Schema::hasTable('settings')) {
            return;
        }

        DB::table('settings')->where('key', 'rental.addons_enabled')->delete();
    }
};
