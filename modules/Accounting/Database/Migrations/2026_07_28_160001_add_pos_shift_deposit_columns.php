<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('pos_shifts') || ! Schema::hasTable('company_bank_accounts')) {
            return;
        }

        Schema::table('pos_shifts', function (Blueprint $table) {
            if (! Schema::hasColumn('pos_shifts', 'deposit_to_company_bank_account_id')) {
                $table->foreignId('deposit_to_company_bank_account_id')
                    ->nullable()
                    ->after('cash_variance')
                    ->constrained('company_bank_accounts')
                    ->nullOnDelete();
            }

            if (! Schema::hasColumn('pos_shifts', 'deposit_amount')) {
                $table->decimal('deposit_amount', 15, 2)
                    ->nullable()
                    ->after('deposit_to_company_bank_account_id');
            }
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('pos_shifts')) {
            return;
        }

        Schema::table('pos_shifts', function (Blueprint $table) {
            if (Schema::hasColumn('pos_shifts', 'deposit_to_company_bank_account_id')) {
                $table->dropConstrainedForeignId('deposit_to_company_bank_account_id');
            }
            if (Schema::hasColumn('pos_shifts', 'deposit_amount')) {
                $table->dropColumn('deposit_amount');
            }
        });
    }
};
