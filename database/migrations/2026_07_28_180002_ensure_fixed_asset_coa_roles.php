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

        // Restore inventory adj if a prior FA seed overwrote 6300.
        DB::table('accounts')->updateOrInsert(
            ['code' => '6300'],
            [
                'name' => 'Selisih Persediaan',
                'type' => 'expense',
                'parent_id' => null,
                'is_postable' => true,
                'is_active' => true,
                'normal_balance' => 'debit',
                'currency' => 'IDR',
                'system_role' => 'inventory_adj',
                'updated_at' => $now,
                'created_at' => $now,
            ]
        );

        $rows = [
            [
                'code' => '1500',
                'name' => 'Aset Tetap',
                'type' => 'asset',
                'normal_balance' => 'debit',
                'system_role' => 'fixed_asset',
            ],
            [
                'code' => '1510',
                'name' => 'Akumulasi Penyusutan',
                'type' => 'asset',
                'normal_balance' => 'credit',
                'system_role' => 'accum_depreciation',
            ],
            [
                'code' => '6400',
                'name' => 'Beban Penyusutan',
                'type' => 'expense',
                'normal_balance' => 'debit',
                'system_role' => 'depreciation_expense',
            ],
        ];

        foreach ($rows as $account) {
            $existing = DB::table('accounts')->where('code', $account['code'])->first();
            if ($existing) {
                DB::table('accounts')->where('code', $account['code'])->update([
                    'name' => $account['name'],
                    'type' => $account['type'],
                    'is_postable' => true,
                    'is_active' => true,
                    'normal_balance' => $account['normal_balance'],
                    'system_role' => $account['system_role'],
                    'updated_at' => $now,
                ]);
            } else {
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
    }

    public function down(): void
    {
        //
    }
};
