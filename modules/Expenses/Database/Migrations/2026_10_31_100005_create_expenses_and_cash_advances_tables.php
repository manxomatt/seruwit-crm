<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;
use Modules\Expenses\Support\ExpenseSchemaInitializer;

return new class extends Migration
{
    public function up(): void
    {
        ExpenseSchemaInitializer::ensureTables();
        ExpenseSchemaInitializer::ensureSeeded();
    }

    public function down(): void
    {
        Schema::dropIfExists('expense_claim_lines');
        Schema::dropIfExists('expense_claims');
        Schema::dropIfExists('cash_advances');
        Schema::dropIfExists('expense_categories');
    }
};
