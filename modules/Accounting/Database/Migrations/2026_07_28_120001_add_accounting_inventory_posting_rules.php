<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('accounts')) {
            $exists = DB::table('accounts')->where('code', '6300')->exists();
            if (! $exists) {
                DB::table('accounts')->insert([
                    'code' => '6300',
                    'name' => 'Selisih Persediaan',
                    'type' => 'expense',
                    'parent_id' => null,
                    'is_postable' => true,
                    'is_active' => true,
                    'normal_balance' => 'debit',
                    'currency' => 'IDR',
                    'system_role' => 'inventory_adj',
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            } else {
                DB::table('accounts')
                    ->where('code', '6300')
                    ->whereNull('system_role')
                    ->update(['system_role' => 'inventory_adj', 'updated_at' => now()]);
            }
        }

        if (! Schema::hasTable('accounting_posting_rules')) {
            return;
        }

        $now = now();
        $rows = [
            ['event_key' => 'grn.confirmed', 'side' => 'debit', 'system_role' => 'inventory', 'amount_key' => 'inventory', 'sort_order' => 1],
            ['event_key' => 'grn.confirmed', 'side' => 'credit', 'system_role' => 'grni', 'amount_key' => 'inventory', 'sort_order' => 2],

            ['event_key' => 'gin.confirmed', 'side' => 'debit', 'system_role' => 'cogs', 'amount_key' => 'cogs', 'sort_order' => 1],
            ['event_key' => 'gin.confirmed', 'side' => 'credit', 'system_role' => 'inventory', 'amount_key' => 'cogs', 'sort_order' => 2],

            ['event_key' => 'pos_sale.completed', 'side' => 'debit', 'system_role' => 'payment_cash', 'amount_key' => 'paid', 'sort_order' => 1],
            ['event_key' => 'pos_sale.completed', 'side' => 'credit', 'system_role' => 'pos_revenue', 'amount_key' => 'net', 'sort_order' => 2],
            ['event_key' => 'pos_sale.completed', 'side' => 'credit', 'system_role' => 'tax_output', 'amount_key' => 'tax', 'sort_order' => 3],
            ['event_key' => 'pos_sale.completed', 'side' => 'debit', 'system_role' => 'cogs', 'amount_key' => 'cogs', 'sort_order' => 4],
            ['event_key' => 'pos_sale.completed', 'side' => 'credit', 'system_role' => 'inventory', 'amount_key' => 'cogs', 'sort_order' => 5],

            ['event_key' => 'sales_return.confirmed', 'side' => 'debit', 'system_role' => 'inventory', 'amount_key' => 'cogs', 'sort_order' => 1],
            ['event_key' => 'sales_return.confirmed', 'side' => 'credit', 'system_role' => 'cogs', 'amount_key' => 'cogs', 'sort_order' => 2],

            ['event_key' => 'purchase_return.confirmed', 'side' => 'debit', 'system_role' => 'grni', 'amount_key' => 'inventory', 'sort_order' => 1],
            ['event_key' => 'purchase_return.confirmed', 'side' => 'credit', 'system_role' => 'inventory', 'amount_key' => 'inventory', 'sort_order' => 2],

            ['event_key' => 'stock_opname.surplus', 'side' => 'debit', 'system_role' => 'inventory', 'amount_key' => 'inventory', 'sort_order' => 1],
            ['event_key' => 'stock_opname.surplus', 'side' => 'credit', 'system_role' => 'inventory_adj', 'amount_key' => 'inventory', 'sort_order' => 2],

            ['event_key' => 'stock_opname.shortage', 'side' => 'debit', 'system_role' => 'inventory_adj', 'amount_key' => 'inventory', 'sort_order' => 1],
            ['event_key' => 'stock_opname.shortage', 'side' => 'credit', 'system_role' => 'inventory', 'amount_key' => 'inventory', 'sort_order' => 2],
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
            DB::table('accounting_posting_rules')->whereIn('event_key', [
                'grn.confirmed',
                'gin.confirmed',
                'pos_sale.completed',
                'sales_return.confirmed',
                'purchase_return.confirmed',
                'stock_opname.surplus',
                'stock_opname.shortage',
            ])->delete();
        }

        if (Schema::hasTable('accounts')) {
            DB::table('accounts')->where('code', '6300')->delete();
        }
    }
};
