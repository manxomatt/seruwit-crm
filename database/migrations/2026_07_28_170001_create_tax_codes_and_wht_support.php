<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $now = now();

        $this->seedWhtAccounts($now);

        Schema::create('tax_codes', function (Blueprint $table): void {
            $table->id();
            $table->string('code', 32)->unique();
            $table->string('name');
            $table->string('category', 16); // ppn | wht | none
            $table->decimal('rate', 8, 4)->default(0);
            $table->string('calculation', 16)->default('exclusive'); // exclusive | inclusive | none
            $table->string('direction', 16)->default('both'); // output | input | both | payable
            $table->foreignId('output_account_id')->nullable()->constrained('accounts')->nullOnDelete();
            $table->foreignId('input_account_id')->nullable()->constrained('accounts')->nullOnDelete();
            $table->foreignId('wht_account_id')->nullable()->constrained('accounts')->nullOnDelete();
            $table->boolean('is_default')->default(false);
            $table->boolean('is_active')->default(true);
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        $this->seedTaxCodes($now);
        $this->updateBillPaymentPostingRules($now);

        if (Schema::hasTable('bill_payments') && ! Schema::hasColumn('bill_payments', 'wht_amount')) {
            Schema::table('bill_payments', function (Blueprint $table): void {
                $table->decimal('wht_amount', 15, 2)->default(0)->after('amount');
                $table->foreignId('wht_tax_code_id')->nullable()->after('wht_amount')->constrained('tax_codes')->nullOnDelete();
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('bill_payments') && Schema::hasColumn('bill_payments', 'wht_amount')) {
            Schema::table('bill_payments', function (Blueprint $table): void {
                $table->dropConstrainedForeignId('wht_tax_code_id');
                $table->dropColumn('wht_amount');
            });
        }

        Schema::dropIfExists('tax_codes');
    }

    private function seedWhtAccounts(\Illuminate\Support\Carbon $now): void
    {
        if (! Schema::hasTable('accounts')) {
            return;
        }

        $rows = [
            [
                'code' => '1410',
                'name' => 'PPh 23 Dibayar Dimuka',
                'type' => 'asset',
                'normal_balance' => 'debit',
                'system_role' => 'wht_receivable',
            ],
            [
                'code' => '2210',
                'name' => 'Hutang PPh 23',
                'type' => 'liability',
                'normal_balance' => 'credit',
                'system_role' => 'wht_payable',
            ],
        ];

        foreach ($rows as $account) {
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

    private function seedTaxCodes(\Illuminate\Support\Carbon $now): void
    {
        $outputId = DB::table('accounts')->where('system_role', 'tax_output')->value('id');
        $inputId = DB::table('accounts')->where('system_role', 'tax_input')->value('id');
        $whtPayableId = DB::table('accounts')->where('system_role', 'wht_payable')->value('id');

        $legacyEnabled = true;
        $legacyRate = 11.0;
        if (Schema::hasTable('settings')) {
            $enabled = DB::table('settings')->where('key', 'ecommerce.tax_enabled')->value('value');
            $rate = DB::table('settings')->where('key', 'ecommerce.tax_rate')->value('value');
            if ($enabled !== null) {
                $legacyEnabled = $enabled === '1' || $enabled === 1 || $enabled === true;
            }
            if ($rate !== null && is_numeric($rate)) {
                $legacyRate = (float) $rate;
            }
        }

        $codes = [
            [
                'code' => 'PPN11',
                'name' => 'PPN 11%',
                'category' => 'ppn',
                'rate' => 11,
                'calculation' => 'exclusive',
                'direction' => 'both',
                'output_account_id' => $outputId,
                'input_account_id' => $inputId,
                'wht_account_id' => null,
                'is_default' => $legacyEnabled && abs($legacyRate - 11) < 0.001,
            ],
            [
                'code' => 'PPN12',
                'name' => 'PPN 12%',
                'category' => 'ppn',
                'rate' => 12,
                'calculation' => 'exclusive',
                'direction' => 'both',
                'output_account_id' => $outputId,
                'input_account_id' => $inputId,
                'wht_account_id' => null,
                'is_default' => $legacyEnabled && abs($legacyRate - 12) < 0.001,
            ],
            [
                'code' => 'NONTAX',
                'name' => 'Non-taxable',
                'category' => 'none',
                'rate' => 0,
                'calculation' => 'none',
                'direction' => 'both',
                'output_account_id' => null,
                'input_account_id' => null,
                'wht_account_id' => null,
                'is_default' => ! $legacyEnabled,
            ],
            [
                'code' => 'PPH23_2',
                'name' => 'PPh 23 2%',
                'category' => 'wht',
                'rate' => 2,
                'calculation' => 'exclusive',
                'direction' => 'payable',
                'output_account_id' => null,
                'input_account_id' => null,
                'wht_account_id' => $whtPayableId,
                'is_default' => false,
            ],
        ];

        $hasDefault = collect($codes)->contains(fn (array $row): bool => $row['is_default']);
        if (! $hasDefault) {
            $codes[0]['is_default'] = true;
        }

        foreach ($codes as $code) {
            DB::table('tax_codes')->insertOrIgnore([
                ...$code,
                'is_active' => true,
                'notes' => null,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }
    }

    private function updateBillPaymentPostingRules(\Illuminate\Support\Carbon $now): void
    {
        if (! Schema::hasTable('accounting_posting_rules')) {
            return;
        }

        DB::table('accounting_posting_rules')
            ->where('event_key', 'bill_payment.recorded')
            ->where('system_role', 'payment_cash')
            ->where('amount_key', 'paid')
            ->update([
                'amount_key' => 'paid_net',
                'updated_at' => $now,
            ]);

        $exists = DB::table('accounting_posting_rules')
            ->where('event_key', 'bill_payment.recorded')
            ->where('system_role', 'wht_payable')
            ->exists();

        if (! $exists) {
            DB::table('accounting_posting_rules')->insert([
                'event_key' => 'bill_payment.recorded',
                'side' => 'credit',
                'system_role' => 'wht_payable',
                'amount_key' => 'wht',
                'sort_order' => 3,
                'skip_if_zero' => true,
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }
    }
};
