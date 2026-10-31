<?php

use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        // Core Cash & Bank tables (company_bank_accounts, payment_method_account_maps,
        // bank_transactions, bank_reconciliations, bank_statement_lines) are provisioned
        // by the core accounting migrations.
    }

    public function down(): void
    {
        // Non-destructive for shared accounting ledger tables.
    }
};
