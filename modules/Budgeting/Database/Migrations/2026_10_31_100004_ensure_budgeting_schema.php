<?php

use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        // Core Budgeting tables (budgets, budget_lines) are provisioned by core accounting migrations.
    }

    public function down(): void
    {
        // Non-destructive for shared accounting budget tables.
    }
};
