<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('accounts')) {
            return;
        }

        $now = now();

        $existing = DB::table('accounts')->where('system_role', 'saas_revenue')->first()
            ?? DB::table('accounts')->where('code', '4140')->first();

        if ($existing) {
            DB::table('accounts')->where('id', $existing->id)->update([
                'name' => 'Pendapatan Langganan SaaS',
                'type' => 'revenue',
                'is_postable' => true,
                'is_active' => true,
                'normal_balance' => 'credit',
                'system_role' => 'saas_revenue',
                'updated_at' => $now,
            ]);
        } else {
            DB::table('accounts')->insert([
                'code' => '4140',
                'name' => 'Pendapatan Langganan SaaS',
                'type' => 'revenue',
                'parent_id' => null,
                'is_postable' => true,
                'is_active' => true,
                'normal_balance' => 'credit',
                'currency' => 'IDR',
                'system_role' => 'saas_revenue',
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }
    }

    public function down(): void
    {
        //
    }
};
