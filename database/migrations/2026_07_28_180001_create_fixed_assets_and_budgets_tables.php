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
        $this->seedFaAccounts($now);

        Schema::create('fixed_assets', function (Blueprint $table): void {
            $table->id();
            $table->string('code', 32)->unique();
            $table->string('name');
            $table->string('category', 64)->nullable();
            $table->date('acquisition_date');
            $table->decimal('acquisition_cost', 15, 2);
            $table->decimal('salvage_value', 15, 2)->default(0);
            $table->unsignedInteger('useful_life_months');
            $table->string('method', 32)->default('straight_line');
            $table->foreignId('asset_account_id')->constrained('accounts');
            $table->foreignId('accum_depr_account_id')->constrained('accounts');
            $table->foreignId('expense_account_id')->constrained('accounts');
            $table->unsignedBigInteger('vehicle_id')->nullable()->index();
            $table->string('status', 16)->default('active');
            $table->decimal('accumulated_depreciation', 15, 2)->default(0);
            $table->date('last_depreciated_on')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('budgets', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('fiscal_year_id')->constrained('fiscal_years')->cascadeOnDelete();
            $table->string('name');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('budget_lines', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('budget_id')->constrained('budgets')->cascadeOnDelete();
            $table->foreignId('account_id')->constrained('accounts')->cascadeOnDelete();
            $table->foreignId('fiscal_period_id')->constrained('fiscal_periods')->cascadeOnDelete();
            $table->decimal('amount', 15, 2)->default(0);
            $table->timestamps();

            $table->unique(['budget_id', 'account_id', 'fiscal_period_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('budget_lines');
        Schema::dropIfExists('budgets');
        Schema::dropIfExists('fixed_assets');
    }

    private function seedFaAccounts(\Illuminate\Support\Carbon $now): void
    {
        if (! Schema::hasTable('accounts')) {
            return;
        }

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
};
