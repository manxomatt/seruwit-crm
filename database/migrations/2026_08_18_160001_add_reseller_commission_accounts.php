<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Accounts the reseller commission postings need in the operator tenant's
 * chart of accounts.
 *
 * Withholding reuses the existing `wht_payable` (2210, Hutang PPh 23) rather
 * than adding a parallel account — reseller fees are withheld under the same
 * PPh 23 the rest of the ledger already tracks.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('accounts')) {
            return;
        }

        $now = now();

        $rows = [
            [
                'code' => '2500',
                'name' => 'Hutang Komisi Reseller',
                'type' => 'liability',
                'normal_balance' => 'credit',
                'system_role' => 'reseller_commission_payable',
            ],
            [
                'code' => '6500',
                'name' => 'Beban Komisi Reseller',
                'type' => 'expense',
                'normal_balance' => 'debit',
                'system_role' => 'reseller_commission_expense',
            ],
        ];

        foreach ($rows as $account) {
            if (DB::table('accounts')->where('system_role', $account['system_role'])->exists()) {
                continue;
            }

            DB::table('accounts')->insertOrIgnore([
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

    public function down(): void
    {
        //
    }
};
