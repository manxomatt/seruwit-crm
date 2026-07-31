<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $now = now();

        if (Schema::hasTable('accounts')) {
            $exists = DB::table('accounts')->where('code', '4130')->exists();

            if ($exists) {
                DB::table('accounts')
                    ->where('code', '4130')
                    ->whereNull('system_role')
                    ->update([
                        'system_role' => 'shuttle_revenue',
                        'updated_at' => $now,
                    ]);
            } else {
                DB::table('accounts')->insert([
                    'code' => '4130',
                    'name' => 'Pendapatan Travel',
                    'type' => 'revenue',
                    'parent_id' => null,
                    'is_postable' => true,
                    'is_active' => true,
                    'normal_balance' => 'credit',
                    'currency' => 'IDR',
                    'system_role' => 'shuttle_revenue',
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }
        }

        if (! Schema::hasTable('accounting_posting_rules')) {
            return;
        }

        $rows = [
            // Walk-in / cash travel sale (no AR partner invoice)
            ['event_key' => 'shuttle_sale.completed', 'side' => 'debit', 'system_role' => 'payment_cash', 'amount_key' => 'paid', 'sort_order' => 1],
            ['event_key' => 'shuttle_sale.completed', 'side' => 'credit', 'system_role' => 'shuttle_revenue', 'amount_key' => 'net', 'sort_order' => 2],
            ['event_key' => 'shuttle_sale.completed', 'side' => 'credit', 'system_role' => 'tax_output', 'amount_key' => 'tax', 'sort_order' => 3],
        ];

        foreach ($rows as $row) {
            $exists = DB::table('accounting_posting_rules')
                ->where('event_key', $row['event_key'])
                ->where('system_role', $row['system_role'])
                ->where('amount_key', $row['amount_key'])
                ->where('side', $row['side'])
                ->exists();

            if ($exists) {
                continue;
            }

            DB::table('accounting_posting_rules')->insert([
                ...$row,
                'skip_if_zero' => true,
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('accounting_posting_rules')) {
            DB::table('accounting_posting_rules')->where('event_key', 'shuttle_sale.completed')->delete();
        }

        if (Schema::hasTable('accounts')) {
            DB::table('accounts')->where('code', '4130')->where('system_role', 'shuttle_revenue')->delete();
        }
    }
};
