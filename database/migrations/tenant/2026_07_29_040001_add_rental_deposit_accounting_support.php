<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $now = now();

        if (Schema::hasTable('bank_transactions') && ! Schema::hasColumn('bank_transactions', 'event')) {
            Schema::table('bank_transactions', function (\Illuminate\Database\Schema\Blueprint $table): void {
                $table->string('event', 64)->nullable()->after('source_id')->index();
            });
        }

        if (Schema::hasTable('accounts')) {
            $accounts = [
                [
                    'code' => '2400',
                    'name' => 'Deposit Pelanggan',
                    'type' => 'liability',
                    'normal_balance' => 'credit',
                    'system_role' => 'customer_deposit',
                ],
                [
                    'code' => '4120',
                    'name' => 'Pendapatan Sewa',
                    'type' => 'revenue',
                    'normal_balance' => 'credit',
                    'system_role' => 'rental_revenue',
                ],
            ];

            foreach ($accounts as $account) {
                $exists = DB::table('accounts')->where('code', $account['code'])->exists();

                if ($exists) {
                    DB::table('accounts')
                        ->where('code', $account['code'])
                        ->whereNull('system_role')
                        ->update([
                            'system_role' => $account['system_role'],
                            'updated_at' => $now,
                        ]);

                    continue;
                }

                DB::table('accounts')->insert([
                    'code' => $account['code'],
                    'name' => $account['name'],
                    'type' => $account['type'],
                    'parent_id' => null,
                    'is_postable' => true,
                    'is_active' => true,
                    'normal_balance' => $account['normal_balance'],
                    'currency' => 'IDR',
                    'system_role' => $account['system_role'],
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }
        }

        if (! Schema::hasTable('accounting_posting_rules')) {
            return;
        }

        $rows = [
            // Cash in → customer deposit liability
            ['event_key' => 'rental_deposit.received', 'side' => 'debit', 'system_role' => 'payment_cash', 'amount_key' => 'deposit', 'sort_order' => 1],
            ['event_key' => 'rental_deposit.received', 'side' => 'credit', 'system_role' => 'customer_deposit', 'amount_key' => 'deposit', 'sort_order' => 2],

            // Release liability: to AR and/or forfeited revenue
            ['event_key' => 'rental_deposit.applied', 'side' => 'debit', 'system_role' => 'customer_deposit', 'amount_key' => 'applied', 'sort_order' => 1],
            ['event_key' => 'rental_deposit.applied', 'side' => 'credit', 'system_role' => 'ar_control', 'amount_key' => 'to_ar', 'sort_order' => 2],
            ['event_key' => 'rental_deposit.applied', 'side' => 'credit', 'system_role' => 'rental_revenue', 'amount_key' => 'forfeited', 'sort_order' => 3],

            // Refund remaining deposit to customer
            ['event_key' => 'rental_deposit.refunded', 'side' => 'debit', 'system_role' => 'customer_deposit', 'amount_key' => 'refunded', 'sort_order' => 1],
            ['event_key' => 'rental_deposit.refunded', 'side' => 'credit', 'system_role' => 'payment_cash', 'amount_key' => 'refunded', 'sort_order' => 2],
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
                'rental_deposit.received',
                'rental_deposit.applied',
                'rental_deposit.refunded',
            ])->delete();
        }

        if (Schema::hasTable('accounts')) {
            DB::table('accounts')->whereIn('code', ['2400', '4120'])->delete();
        }

        if (Schema::hasTable('bank_transactions') && Schema::hasColumn('bank_transactions', 'event')) {
            Schema::table('bank_transactions', function (\Illuminate\Database\Schema\Blueprint $table): void {
                $table->dropColumn('event');
            });
        }
    }
};
