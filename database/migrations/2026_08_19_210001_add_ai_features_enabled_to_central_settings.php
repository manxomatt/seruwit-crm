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
            ['key' => 'general.ai_features_enabled'],
            [
                'group' => 'general',
                'value' => '1',
                'type' => 'boolean',
                'label' => 'Fitur AI (Artificial Intelligence)',
                'description' => 'Master switch untuk mengaktifkan atau menonaktifkan seluruh fitur AI (Visual Handover, Smart KYC, Dynamic Pricing, Predictive Maintenance) di semua workspace tenant.',
                'is_public' => true,
                'sort_order' => 9,
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

        DB::table('settings')->where('key', 'general.ai_features_enabled')->delete();
    }
};
