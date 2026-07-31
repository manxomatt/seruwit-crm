<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('company_bank_accounts', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('kind', 16)->default('bank')->index();
            $table->string('bank_name')->nullable();
            $table->string('account_number')->nullable();
            $table->string('account_holder')->nullable();
            $table->foreignId('account_id')->constrained('accounts');
            $table->boolean('is_default')->default(false);
            $table->boolean('is_active')->default(true);
            $table->string('currency', 3)->default('IDR');
            $table->timestamps();
        });

        Schema::create('payment_method_account_maps', function (Blueprint $table) {
            $table->id();
            $table->string('payment_method', 32)->unique();
            $table->foreignId('company_bank_account_id')->constrained('company_bank_accounts')->cascadeOnDelete();
            $table->timestamps();
        });

        $this->addOptionalColumn('payments');
        $this->addOptionalColumn('bill_payments');
        $this->addOptionalColumn('pos_payments');

        $this->seedDefaults();
        $this->seedBankPermission();
    }

    public function down(): void
    {
        foreach (['payments', 'bill_payments', 'pos_payments'] as $table) {
            if (Schema::hasTable($table) && Schema::hasColumn($table, 'company_bank_account_id')) {
                Schema::table($table, function (Blueprint $blueprint): void {
                    $blueprint->dropConstrainedForeignId('company_bank_account_id');
                });
            }
        }

        Schema::dropIfExists('payment_method_account_maps');
        Schema::dropIfExists('company_bank_accounts');
    }

    private function addOptionalColumn(string $table): void
    {
        if (! Schema::hasTable($table) || Schema::hasColumn($table, 'company_bank_account_id')) {
            return;
        }

        Schema::table($table, function (Blueprint $blueprint): void {
            $blueprint->foreignId('company_bank_account_id')
                ->nullable()
                ->after('method')
                ->constrained('company_bank_accounts')
                ->nullOnDelete();
        });
    }

    private function seedDefaults(): void
    {
        if (! Schema::hasTable('accounts')) {
            return;
        }

        $cashAccountId = DB::table('accounts')->where('system_role', 'cash')->value('id');
        $bankAccountId = DB::table('accounts')->where('system_role', 'bank')->value('id');

        if ($cashAccountId === null || $bankAccountId === null) {
            return;
        }

        $now = now();

        $cashId = DB::table('company_bank_accounts')->insertGetId([
            'name' => 'Kas Tunai',
            'kind' => 'cash',
            'bank_name' => null,
            'account_number' => null,
            'account_holder' => null,
            'account_id' => $cashAccountId,
            'is_default' => true,
            'is_active' => true,
            'currency' => 'IDR',
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        $bankId = DB::table('company_bank_accounts')->insertGetId([
            'name' => 'Bank Operasional',
            'kind' => 'bank',
            'bank_name' => 'Bank',
            'account_number' => null,
            'account_holder' => null,
            'account_id' => $bankAccountId,
            'is_default' => true,
            'is_active' => true,
            'currency' => 'IDR',
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        $maps = [
            'cash' => $cashId,
            'transfer' => $bankId,
            'giro' => $bankId,
            'card' => $bankId,
            'qris' => $bankId,
            'other' => $bankId,
        ];

        foreach ($maps as $method => $companyBankAccountId) {
            DB::table('payment_method_account_maps')->insert([
                'payment_method' => $method,
                'company_bank_account_id' => $companyBankAccountId,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }
    }

    private function seedBankPermission(): void
    {
        if (! Schema::hasTable('permissions')) {
            return;
        }

        $exists = DB::table('permissions')
            ->where('module', 'accounting')
            ->where('action', 'bank')
            ->exists();

        if ($exists) {
            return;
        }

        DB::table('permissions')->insert([
            'name' => 'Bank Accounting',
            'slug' => 'accounting.bank',
            'module' => 'accounting',
            'action' => 'bank',
            'description' => 'Allows Bank operation on Accounting',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
};
